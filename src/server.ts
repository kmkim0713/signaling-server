import express, { Express } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { RoomManager } from "./rooms/room-manager";
import { SfuProxy } from "./signaling/sfu-proxy";
import { SocketHandler } from "./handlers/socket-handler";
import { Logger } from "./utils/logger";

const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// 미들웨어
app.use(cors());
app.use(express.json());

// 설정
const PORT = process.env.PORT || 3000;
const SFU_SERVER = process.env.SFU_SERVER || "http://localhost:3001";

// 초기화
const roomManager = new RoomManager();
const sfuProxy = new SfuProxy(SFU_SERVER);
const socketHandler = new SocketHandler(roomManager, sfuProxy);

// Socket.IO 연결 처리
io.on("connection", (socket) => {
  socketHandler.registerHandlers(socket);
});

// 헬스 체크 엔드포인트
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Signaling server is running" });
});

// 서버 시작
server.listen(PORT, () => {
  Logger.info("Signaling server started", { port: PORT, sfuServer: SFU_SERVER });
});
