#!/usr/bin/env node
// firebase-logs-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { spawn } from 'child_process';

class FirebaseLogsMCPServer {
  private server: Server;
  private emulatorProcess?: any;

  constructor() {
    this.server = new Server(
      { name: 'firebase-logs', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {} } }
    );

    this.setupTools();
    this.setupResources();
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_firebase_logs',
          description: 'Get recent Firebase emulator logs',
          inputSchema: {
            type: 'object',
            properties: {
              service: { type: 'string', enum: ['firestore', 'auth', 'functions', 'all'] },
              lines: { type: 'number', default: 50 }
            }
          }
        },
        {
          name: 'watch_firebase_logs',
          description: 'Start watching Firebase logs in real-time',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'get_firebase_logs') {
        return this.getFirebaseLogs(request.params.arguments);
      }
      if (request.params.name === 'watch_firebase_logs') {
        return this.watchFirebaseLogs();
      }
      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
    });
  }

  private setupResources() {
    // Resources can be added later if needed
  }

  private async getFirebaseLogs(args: any) {
    const logPath = process.env.FIREBASE_LOG_PATH || './emulator-debug.log';
    const logs = await this.readRecentLogs(logPath, args?.lines || 50, args?.service);

    return {
      content: [{
        type: 'text',
        text: `Firebase Emulator Logs (${args?.service || 'all'}):\n\n${logs}`
      }]
    };
  }

  private async watchFirebaseLogs() {
    return {
      content: [{
        type: 'text',
        text: 'Log watching feature is currently in development. Use get_firebase_logs for now.'
      }]
    };
  }

  private async readRecentLogs(logPath: string, lines: number = 50, service?: string): Promise<string> {
    try {
      if (!existsSync(logPath)) {
        return `Log file not found at ${logPath}. Make sure Firebase emulators are running with the start.sh script.`;
      }

      const content = await readFile(logPath, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim() !== '');
      
      let filteredLines = allLines;
      if (service && service !== 'all') {
        const servicePattern = new RegExp(service, 'i');
        filteredLines = allLines.filter(line => servicePattern.test(line));
      }

      const recentLines = filteredLines.slice(-lines);
      
      if (recentLines.length === 0) {
        return service && service !== 'all' 
          ? `No logs found for service: ${service}`
          : 'No logs available';
      }

      return recentLines.join('\n');
    } catch (error) {
      return `Error reading log file: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new FirebaseLogsMCPServer();
server.run().catch(console.error);
