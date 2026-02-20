import { Socket } from "socket.io";
import { RoomManager } from "../rooms/room-manager";
import { SfuProxy } from "../signaling/sfu-proxy";
import { Validator } from "../utils/validator";
import { Logger } from "../utils/logger";
import {
  ConnectTransportPayload,
  ProducePayload,
  ConsumePayload,
  ErrorMessage,
  NewConsumerEvent,
  PeerMeta,
  JoinRoomPayload,
} from "../types/index";

/**
 * Socket.IO 이벤트 핸들러
 */
export class SocketHandler {
  private roomManager: RoomManager;
  private sfuProxy: SfuProxy;
  private peerMeta: Map<string, PeerMeta> = new Map();

  constructor(roomManager: RoomManager, sfuProxy: SfuProxy) {
    this.roomManager = roomManager;
    this.sfuProxy = sfuProxy;
  }

  /**
   * 모든 소켓 이벤트 리스너 등록
   */
  registerHandlers(socket: Socket): void {
    Logger.info("Client connected", { socketId: socket.id });

    socket.on("join-room", (payload: unknown, callback: unknown) => {
      this.handleJoinRoom(socket, payload, callback as (data: unknown) => void);
    });

    socket.on("create-web-rtc-transport", (payload: unknown, callback: unknown) => {
      this.handleCreateTransport(socket, payload, callback as (data: unknown) => void);
    });

    socket.on("connect-transport", (payload: unknown, callback: unknown) => {
      this.handleConnectTransport(socket, payload, callback as (data: unknown) => void);
    });

    socket.on("produce", (payload: unknown, callback: unknown) => {
      this.handleProduce(socket, payload, callback as (data: unknown) => void);
    });

    socket.on("consume", (payload: unknown, callback: unknown) => {
      this.handleConsume(socket, payload, callback as (data: unknown) => void);
    });

    socket.on("leave-room", () => {
      this.handleLeaveRoom(socket);
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * join-room 핸들러
   */
  private async handleJoinRoom(
    socket: Socket,
    payload: unknown,
    callback: (data: unknown) => void
  ): Promise<void> {
    try {
      const typedPayload = payload as Record<string, unknown>;
      const { meetingId, userId, userName } = typedPayload as unknown as JoinRoomPayload;

      if (!Validator.validateRoomId(meetingId)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_MEETING_ID",
          message: "Meeting ID must be a non-empty string",
        };
        callback(error);
        return;
      }

      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_USER_ID",
          message: "User ID must be a non-empty string",
        };
        callback(error);
        return;
      }

      if (!userName || typeof userName !== 'string' || !userName.trim()) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_USER_NAME",
          message: "User name must be a non-empty string",
        };
        callback(error);
        return;
      }

      // 기존 Producer 조회 (join 전에 다른 피어 목록 조회)
      const otherPeers = this.roomManager.getPeers(meetingId, socket.id);
      const existingProducers = [];

      for (const peerId of otherPeers) {
        try {
          const meta = this.peerMeta.get(peerId) ?? { userId: '', userName: '' };
          const producersData = await this.sfuProxy.getExistingProducers(peerId);
          if (producersData.producers && producersData.producers.length > 0) {
            existingProducers.push({
              peerId,
              userId: meta.userId,
              userName: meta.userName,
              producers: producersData.producers,
            });
          }
        } catch (error) {
          Logger.warn("Failed to get producers for peer", { peerId });
        }
      }

      // peerMeta에 사용자 정보 저장
      this.peerMeta.set(socket.id, { userId, userName });

      // 새 피어를 방에 추가 (meetingId를 roomId 파라미터로 전달)
      this.roomManager.addPeer(meetingId, socket.id);

      // RTP Capabilities 조회
      try {
        const rtpCapabilities = await this.sfuProxy.getRtpCapabilities();
        callback({
          existingProducers,
          rtpCapabilities,
        });

        // RTP Capabilities 클라이언트로 전송
        socket.emit("rtp-capabilities", rtpCapabilities);
      } catch (error) {
        const errorMsg: ErrorMessage = {
          type: "error",
          code: "RTP_CAPABILITIES_ERROR",
          message: "Failed to get RTP capabilities",
        };
        callback(errorMsg);
      }
    } catch (error) {
      Logger.error("Error in join-room handler", { socketId: socket.id, error });
      const errorMsg: ErrorMessage = {
        type: "error",
        code: "JOIN_ROOM_ERROR",
        message: "Internal server error",
      };
      callback(errorMsg);
    }
  }

  /**
   * create-web-rtc-transport 핸들러
   */
  private async handleCreateTransport(socket: Socket, _payload: unknown, callback: (data: unknown) => void): Promise<void> {
    try {
      const transportResponse = await this.sfuProxy.createTransport(socket.id);
      callback(transportResponse);
    } catch (error) {
      Logger.error("Error in create-web-rtc-transport handler", { socketId: socket.id });
      const errorMsg: ErrorMessage = {
        type: "error",
        code: "CREATE_TRANSPORT_ERROR",
        message: "Failed to create transport",
      };
      callback(errorMsg);
    }
  }

  /**
   * connect-transport 핸들러
   */
  private async handleConnectTransport(
    socket: Socket,
    payload: unknown,
    callback: (data: unknown) => void
  ): Promise<void> {
    try {
      const typedPayload = payload as Record<string, unknown>;
      const transportId = typedPayload.transportId;
      const dtlsParameters = typedPayload.dtlsParameters;

      if (!Validator.validateTransportId(transportId)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_TRANSPORT_ID",
          message: "Invalid transport ID",
        };
        callback(error);
        return;
      }

      if (!Validator.validateDtlsParameters(dtlsParameters)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_DTLS_PARAMETERS",
          message: "Invalid DTLS parameters",
        };
        callback(error);
        return;
      }

      const params: ConnectTransportPayload = {
        transportId,
        dtlsParameters: dtlsParameters as ConnectTransportPayload["dtlsParameters"],
      };

      await this.sfuProxy.connectTransport(params, socket.id);
      callback({});
    } catch (error) {
      Logger.error("Error in connect-transport handler", { socketId: socket.id });
      const errorMsg: ErrorMessage = {
        type: "error",
        code: "CONNECT_TRANSPORT_ERROR",
        message: "Failed to connect transport",
      };
      callback(errorMsg);
    }
  }

  /**
   * produce 핸들러
   */
  private async handleProduce(
    socket: Socket,
    payload: unknown,
    callback: (data: unknown) => void
  ): Promise<void> {
    try {
      const typedPayload = payload as Record<string, unknown>;
      const transportId = typedPayload.transportId;
      const kind = typedPayload.kind;
      const rtpParameters = typedPayload.rtpParameters;

      if (!Validator.validateTransportId(transportId)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_TRANSPORT_ID",
          message: "Invalid transport ID",
        };
        callback(error);
        return;
      }

      if (!Validator.validateKind(kind)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_KIND",
          message: "Kind must be 'audio' or 'video'",
        };
        callback(error);
        return;
      }

      if (!Validator.validateRtpParameters(rtpParameters)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_RTP_PARAMETERS",
          message: "Invalid RTP parameters",
        };
        callback(error);
        return;
      }

      const params: ProducePayload = {
        transportId,
        kind,
        rtpParameters: rtpParameters as ProducePayload["rtpParameters"],
      };

      const produceResponse = await this.sfuProxy.produce(params, socket.id);

      // 같은 방의 다른 피어들에게 알림
      const roomId = this.roomManager.getRoomId(socket.id);
      if (roomId) {
        const otherPeers = this.roomManager.getPeers(roomId, socket.id);
        const meta = this.peerMeta.get(socket.id) ?? { userId: '', userName: '' };
        const event: NewConsumerEvent = {
          producerId: produceResponse.id,
          id: socket.id,
          kind,
          userId: meta.userId,
          userName: meta.userName,
        };
        otherPeers.forEach((peerId) => {
          socket.to(peerId).emit("newConsumer", event);
        });
      }

      callback(produceResponse);
    } catch (error) {
      Logger.error("Error in produce handler", { socketId: socket.id });
      const errorMsg: ErrorMessage = {
        type: "error",
        code: "PRODUCE_ERROR",
        message: "Failed to produce",
      };
      callback(errorMsg);
    }
  }

  /**
   * consume 핸들러
   */
  private async handleConsume(
    socket: Socket,
    payload: unknown,
    callback: (data: unknown) => void
  ): Promise<void> {
    try {
      const typedPayload = payload as Record<string, unknown>;
      const transportId = typedPayload.transportId;
      const producerId = typedPayload.producerId;
      const kind = typedPayload.kind;

      if (!Validator.validateTransportId(transportId)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_TRANSPORT_ID",
          message: "Invalid transport ID",
        };
        callback(error);
        return;
      }

      if (!Validator.validateProducerId(producerId)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_PRODUCER_ID",
          message: "Invalid producer ID",
        };
        callback(error);
        return;
      }

      if (!Validator.validateKind(kind)) {
        const error: ErrorMessage = {
          type: "error",
          code: "INVALID_KIND",
          message: "Kind must be 'audio' or 'video'",
        };
        callback(error);
        return;
      }

      const params: ConsumePayload = {
        transportId,
        producerId,
        kind,
      };

      const consumeResponse = await this.sfuProxy.consume(params, socket.id);
      callback(consumeResponse);
    } catch (error) {
      Logger.error("Error in consume handler", { socketId: socket.id });
      const errorMsg: ErrorMessage = {
        type: "error",
        code: "CONSUME_ERROR",
        message: "Failed to consume",
      };
      callback(errorMsg);
    }
  }

  /**
   * leave-room 핸들러
   */
  private handleLeaveRoom(socket: Socket): void {
    const removedRooms = this.roomManager.removePeer(socket.id);

    removedRooms.forEach((roomId) => {
      const remainingPeers = this.roomManager.getPeers(roomId);
      remainingPeers.forEach((peerId) => {
        socket.to(peerId).emit("peer-disconnected", socket.id);
      });
    });

    // peerMeta 정리
    this.peerMeta.delete(socket.id);

    Logger.info("Peer left room", { socketId: socket.id });
  }

  /**
   * disconnect 핸들러
   */
  private handleDisconnect(socket: Socket): void {
    const removedRooms = this.roomManager.removePeer(socket.id);

    removedRooms.forEach((roomId) => {
      const remainingPeers = this.roomManager.getPeers(roomId);
      remainingPeers.forEach((peerId) => {
        socket.to(peerId).emit("peer-disconnected", socket.id);
      });
    });

    // peerMeta 정리
    this.peerMeta.delete(socket.id);

    Logger.info("Client disconnected", { socketId: socket.id });
  }
}
