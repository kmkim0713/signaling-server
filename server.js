import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// SFU 서버 주소
const SFU_SERVER = 'http://localhost:3001';

// 방과 참여자 관리
const rooms = new Map(); // roomId -> Set(socket.id)



io.on('connection', socket => {
  console.log('클라이언트 연결:', socket.id);

  // 소켓의 참가요청에 대한 리스너. SFU 서버로 요청
  socket.on('join-room', async ({ roomId }, callback) => {
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());

    const existingProducers = [];

    for (let peerId of rooms.get(roomId)) {
      if (peerId === socket.id) continue; // 자기 자신 제외
      const res = await axios.get(`${SFU_SERVER}/peer-producers?peerId=${peerId}`);
      if (res.data && res.data.producers.length > 0) {
        existingProducers.push(res.data); // peerId 단위로 push
      }
    }

    callback({ existingProducers });

    // 신규 유저 rooms에 추가
    rooms.get(roomId).add(socket.id);

    // RTP Capabilities 전달
    const { data } = await axios.get(`${SFU_SERVER}/rtp-capabilities`);
    socket.emit('rtp-capabilities', data);
  });



  // 클라이언트 요청: send/recv transport 생성
  socket.on('create-web-rtc-transport', async ({ }, callback) => {
    try {
      const { data } = await axios.post(`${SFU_SERVER}/create-web-rtc-transport`, {
        peerId: socket.id
      });
      callback(data);
    } catch (err) {
      console.error(err);
      callback({ error: err.message });
    }
  });


  // 클라이언트 요청: transport 연결
  socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      await axios.post(`${SFU_SERVER}/connect-transport`, { transportId, dtlsParameters, peerId: socket.id });
      callback();
    } catch (err) {
      console.error(err);
      callback({ error: err.message });
    }
  });

  // 클라이언트 요청: produce
  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const { data } = await axios.post(`${SFU_SERVER}/produce`, { transportId, kind, rtpParameters, peerId: socket.id });
      // 다른 참여자에게 알림
      socket.broadcast.emit('newConsumer', { producerId: data.id, id: socket.id, kind });
      callback(data);
    } catch (err) {
      console.error(err);
      callback({ error: err.message });
    }
  });

  // 클라이언트 요청: consume
  socket.on('consume', async ({ transportId, producerId, kind }, callback) => {
    try {
      const { data } = await axios.post(`${SFU_SERVER}/consume`, { transportId, producerId, kind, peerId: socket.id });
      callback(data);
    } catch (err) {
      console.error(err);
      callback({ error: err.message });
    }
  });

  // 퇴장 클릭
  socket.on('leave-room', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.has(socket.id)) {
        room.delete(socket.id);

        // 같은 방에 있는 다른 유저들에게 알림
        for (const peerId of room) {
          io.to(peerId).emit('peer-disconnected', socket.id);
        }
      }
    }
  });

  // 이탈
  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.has(socket.id)) {
        room.delete(socket.id);

        // 같은 방에 있는 다른 유저들에게 알림
        for (const peerId of room) {
          io.to(peerId).emit('peer-disconnected', socket.id);
        }
      }
    }
  });

});

server.listen(3000, () => console.log('시그널링 서버 시작: http://localhost:3000'));
