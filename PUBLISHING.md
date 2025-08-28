# Publishing Instructions

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm CLI:
   ```bash
   npm login
   ```

## Publishing Steps

### 1. Update GitHub URLs

Replace `yourusername` in `package.json` with your actual GitHub username:
- repository.url
- bugs.url  
- homepage

### 2. Verify the build

```bash
npm run build
```

Ensure the TypeScript compilation completes without errors.

### 3. Test locally

```bash
npm link
```

Then in another terminal:
```bash
npx firebase-logs-mcp-server
```

### 4. Check what will be published

```bash
npm pack --dry-run
```

Review the file list to ensure only necessary files are included.

### 5. Publish to npm

For first publication:
```bash
npm publish
```

For updates (increment version first):
```bash
npm version patch  # or minor/major
npm publish
```

### 6. Verify publication

```bash
npm view firebase-logs-mcp-server
```

## Testing the Published Package

### Install globally
```bash
npm install -g firebase-logs-mcp-server
```

### Configure Claude Code

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "firebase-logs": {
      "command": "npx",
      "args": ["firebase-logs-mcp-server"],
      "env": {
        "FIREBASE_LOG_PATH": "/absolute/path/to/your/project/emulator-debug.log"
      }
    }
  }
}
```

### Start Firebase Emulators

In your Firebase project directory:
```bash
./start.sh
```

### Restart Claude Code

The MCP server should now be available in Claude Code.

## Updating the Package

1. Make your changes
2. Update version:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```
3. Build and publish:
   ```bash
   npm run build
   npm publish
   ```

## Troubleshooting

### Permission denied error
If you get a permission error, the package name might be taken. Check availability:
```bash
npm view firebase-logs-mcp-server
```

### Scoped package
If the name is taken, consider using a scoped package:
```bash
npm init --scope=@yourusername
```

Then update package name to `@yourusername/firebase-logs-mcp-server`