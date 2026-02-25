const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// [중요] 정적 파일 경로를 절대 경로로 명시적 지정
app.use(express.static(path.join(__dirname, 'public')));
// 혹시 모르니 assets 폴더만 따로 한 번 더 지정
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

io.on('connection', (socket) => {
    console.log('유저 접속:', socket.id);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
