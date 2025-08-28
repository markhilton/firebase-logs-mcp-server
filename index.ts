// firebase-logs-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'child_process';
import { readFile, watchFile } from 'fs/promises';

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
      // ... other tool handlers
    });
  }

  private async getFirebaseLogs(args: any) {
    // Read from Firebase emulator log files or process output
    const logPath = process.env.FIREBASE_LOG_PATH || './emulator-debug.log';
    const logs = await this.readRecentLogs(logPath, args.lines || 50);

    return {
      content: [{
        type: 'text',
        text: `Firebase Emulator Logs (${args.service || 'all'}):\n\n${logs}`
      }]
    };
  }
}
