# Replit Clone

A web-based code editor and development environment inspired by Replit, built with modern web technologies. This project provides a browser-based IDE with file browsing, code editing, and an integrated terminal.

## Features

- **File Browser**: Navigate and browse your project files with a recursive tree view
- **Code Editor**: Syntax-highlighted code editor powered by Ace Editor
- **Integrated Terminal**: Full-featured terminal emulator with real pseudo-terminal (PTY) support
- **Auto-save**: Automatic file saving with debounced writes (5-second delay)
- **Real-time Sync**: File system changes are automatically detected and synced across all connected clients
- **Cross-platform**: Works on Windows (PowerShell), macOS, and Linux (bash)

## Architecture

This project uses a **monorepo architecture** powered by Turborepo, with a clear separation between frontend and backend:

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  File Tree   │  │ Code Editor  │  │   Terminal   │  │
│  │ (React)      │  │ (Ace Editor) │  │ (xterm.js)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                         │                                │
│                    Socket.IO Client                      │
└─────────────────────────┬───────────────────────────────┘
                          │ WebSocket + HTTP
                          │
┌─────────────────────────▼───────────────────────────────┐
│                 Node.js Server (Backend)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Express    │  │  Socket.IO   │  │  Chokidar    │  │
│  │   (REST)     │  │  (WebSocket) │  │  (Watcher)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                         │                                │
│                    ┌────▼─────┐                         │
│                    │ node-pty │                         │
│                    └────┬─────┘                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                    ┌─────▼──────┐
                    │ File System│
                    │  (apps/user)│
                    └────────────┘
```

### Communication Flow

1. **File Operations**: HTTP REST API for reading files and directory structure
2. **Real-time Updates**: WebSocket (Socket.IO) for terminal I/O and file change notifications
3. **Terminal Emulation**: node-pty spawns a real shell process (bash/PowerShell)
4. **File Watching**: Chokidar monitors file system changes and broadcasts updates

## Tech Stack

### Frontend (`apps/web`)
- **Framework**: [Next.js 15](https://nextjs.org/) (React 19 RC)
- **Code Editor**: [React Ace](https://github.com/securingsincity/react-ace) (Ace Editor wrapper)
- **Terminal**: [xterm.js](https://xtermjs.org/) v5.5.0
- **Real-time**: [Socket.IO Client](https://socket.io/) v4.7.5
- **File Tree**: [react-folder-tree](https://www.npmjs.com/package/react-folder-tree) v5.1.1
- **Language**: TypeScript

### Backend (`apps/server`)
- **Runtime**: Node.js
- **Framework**: [Express.js](https://expressjs.com/) v4.19.2
- **WebSocket**: [Socket.IO](https://socket.io/) v4.7.5
- **Terminal**: [node-pty](https://github.com/microsoft/node-pty) v1.0.0
- **File Watching**: [Chokidar](https://github.com/paulmillr/chokidar) v3.6.0
- **Language**: JavaScript

### Build Tools
- **Monorepo**: [Turborepo](https://turbo.build/) v2.0.4
- **Package Manager**: npm v10.2.4 (workspaces)
- **Linting**: ESLint v8
- **Type Checking**: TypeScript v5.4.5
- **Formatting**: Prettier v3.2.5

## Project Structure

```
replit-clone/
├── apps/
│   ├── web/                    # Frontend Next.js application
│   │   ├── app/
│   │   │   ├── _components/
│   │   │   │   ├── socket.jsx  # Socket.IO connection
│   │   │   │   ├── tree.jsx    # File tree component
│   │   │   │   └── terminal.jsx # Terminal component
│   │   │   ├── page.tsx        # Main application page
│   │   │   └── layout.tsx      # Root layout
│   │   └── package.json
│   │
│   ├── server/                 # Backend Express application
│   │   ├── index.js            # Main server file
│   │   ├── utils/
│   │   │   └── buildTree.js    # File tree builder
│   │   └── package.json
│   │
│   ├── user/                   # User workspace directory
│   │   └── (user code files)   # Terminal executes here
│   │
│   └── docs/                   # Documentation site
│
├── packages/
│   ├── ui/                     # Shared React components
│   ├── eslint-config/          # Shared ESLint configs
│   └── typescript-config/      # Shared TypeScript configs
│
├── turbo.json                  # Turborepo configuration
└── package.json                # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 10.2.4

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd replit-clone
```

2. Install dependencies:
```bash
npm install
```

### Development

Start all applications in development mode:
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:9000

Or run applications individually:

```bash
# Frontend only
cd apps/web
npm run dev

# Backend only
cd apps/server
npm run dev
```

### Build

Build all applications:
```bash
npm run build
```

## How It Works

### File Browser

The file tree is generated by recursively scanning the `apps/user/` directory on the server:

```javascript
// Server: buildTree.js
GET /files → buildTree('../user') → JSON tree structure
```

The frontend renders this tree and allows users to click on files to open them.

### Code Editor

When a file is selected:

1. Frontend makes a request: `GET /files/content?path={filePath}`
2. Server reads the file and returns `{content: "..."}`
3. Ace Editor displays the content with syntax highlighting
4. User edits trigger auto-save after 5 seconds of inactivity
5. Save emits: `socket.emit('file:save', {path, content})`

### Terminal

The terminal uses a real pseudo-terminal (PTY):

1. Server spawns a shell process (`bash` or `powershell`) using node-pty
2. User input: `xterm.onData` → `socket.emit('terminal:write', data)`
3. Server writes to PTY: `ptyProcess.write(data)`
4. PTY output: `ptyProcess.onData` → `socket.emit('terminal:data', data)`
5. Frontend displays: `terminal.write(data)` in xterm.js

### Real-time File Sync

Chokidar watches the `apps/user/` directory:

```javascript
watcher.on('all', () => {
  io.emit('file:refresh')  // Broadcast to all clients
})
```

Clients refresh their file tree when they receive this event.

## API Reference

### HTTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/files` | Get file tree structure |
| `GET` | `/files/content?path={path}` | Get file content |

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `terminal:write` | `string` | Write data to terminal |
| `file:save` | `{path, content}` | Save file content |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `terminal:data` | `string` | Terminal output data |
| `file:refresh` | - | File system changed, refresh tree |

## Configuration

### Server Configuration

Edit `apps/server/index.js`:

```javascript
const PORT = process.env.PORT || 9000;  // Server port
const USER_DIR = '../user';             // Working directory
const PTY_COLS = 90;                    // Terminal columns
const PTY_ROWS = 30;                    // Terminal rows
```

### Frontend Configuration

The Socket.IO connection is configured in `apps/web/app/_components/socket.jsx`:

```javascript
const socket = io('http://localhost:9000');
```

## Development Notes

### Security Considerations

**Warning**: This is a development/learning project and is NOT production-ready:

- No authentication or authorization
- CORS is wide open (`*`)
- Direct file system access without sandboxing
- PTY spawns real shell with full system access
- No input validation or sanitization

### Known Limitations

- No multi-user support (single workspace)
- No file upload/download functionality
- Basic error handling
- Single language syntax highlighting (JavaScript mode)
- No Git integration
- No collaborative editing
- No process isolation or containerization

## Future Improvements

- [ ] Add user authentication
- [ ] Implement file upload/download
- [ ] Add multi-language syntax highlighting
- [ ] Integrate Git operations
- [ ] Add collaborative editing (CRDT or OT)
- [ ] Docker containerization for sandboxing
- [ ] File search functionality
- [ ] Code completion and IntelliSense
- [ ] Themes and customization
- [ ] Mobile responsive design

## Contributing

This is a learning project. Feel free to fork and experiment!

## License

MIT

---

Built with Turborepo, Next.js, and Express.js
