const http = require('http');
const express = require('express');
const {Server:SocketServer} = require('socket.io');
const PORT = process.env.PORT || 9000;
const os = require('os');
const pty = require('node-pty');
const path = require('path');
const fs = require('fs/promises');
const generateFileTree = require('./utils/buildTree');
const cors = require('cors');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = new SocketServer({
    cors: '*'
});
app.use(cors({
    origin: '*'
}))


const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 90,
  rows: 30,
  cwd: process.env.INIT_CWD + '/user',
  env: process.env
});

io.attach(server);

chokidar.watch('./user').on('all', async (event, path) => {
    io.emit('file:refresh', path);
});

ptyProcess.onData((data) => {
    io.emit('terminal:data', data);
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit('file:refresh');

    socket.on('file:save', async ({path,content}) => {
        await fs.writeFile(`./user${path}`, content);
    });

    socket.on('terminal:write', (data) => {
        ptyProcess.write(data);
    });

    
});




app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user');
    return res.json(fileTree);
});

app.get('/files/content', async (req, res) => {
    const path= req.query.path;
    const content = await fs.readFile(`./user${path}`, 'utf-8');
    return res.json({content});
});

server.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});

