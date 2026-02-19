import { SocketHandler } from "../src/handlers/socket-handler";
import { RoomManager } from "../src/rooms/room-manager";
import { SfuProxy } from "../src/signaling/sfu-proxy";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock Socket 타입
interface MockSocket {
  id: string;
  emit: jest.Mock;
  to: jest.Mock;
  on: jest.Mock;
}

describe("SocketHandler", () => {
  let socketHandler: SocketHandler;
  let roomManager: RoomManager;
  let sfuProxy: SfuProxy;
  let mockSocket: MockSocket;

  beforeEach(() => {
    roomManager = new RoomManager();
    sfuProxy = new SfuProxy("http://localhost:3001");

    socketHandler = new SocketHandler(roomManager, sfuProxy);

    mockSocket = {
      id: "test-socket-123",
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      on: jest.fn(),
    };
  });

  describe("registerHandlers", () => {
    it("should register all event handlers", () => {
      socketHandler.registerHandlers(mockSocket as any);

      expect(mockSocket.on).toHaveBeenCalledWith("join-room", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("create-web-rtc-transport", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("connect-transport", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("produce", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("consume", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("leave-room", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    });
  });

  describe("handleJoinRoom", () => {
    it("should reject invalid room ID", async () => {
      const callback = jest.fn();
      socketHandler.registerHandlers(mockSocket as any);

      const joinRoomHandler = mockSocket.on.mock.calls[0][1] as (payload: unknown, callback: unknown) => void;
      await joinRoomHandler({ roomId: "" }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          code: "INVALID_ROOM_ID",
        })
      );
    });

    it("should reject non-string room ID", async () => {
      const callback = jest.fn();
      socketHandler.registerHandlers(mockSocket as any);

      const joinRoomHandler = mockSocket.on.mock.calls[0][1] as (payload: unknown, callback: unknown) => void;
      await joinRoomHandler({ roomId: 123 }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          code: "INVALID_ROOM_ID",
        })
      );
    });
  });

  describe("handleLeaveRoom", () => {
    it("should remove peer from room and notify others", () => {
      const mockBroadcast = { emit: jest.fn() };
      mockSocket.to = jest.fn().mockReturnValue(mockBroadcast);

      // Add peers to room
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      roomManager.addPeer("room1", mockSocket.id);

      socketHandler.registerHandlers(mockSocket as any);
      const leaveRoomHandler = mockSocket.on.mock.calls[5][1] as () => void;

      leaveRoomHandler();

      // Peer should be removed
      const peers = roomManager.getPeers("room1");
      expect(peers).not.toContain(mockSocket.id);
      expect(peers).toContain("peer1");
      expect(peers).toContain("peer2");
    });
  });

  describe("handleDisconnect", () => {
    it("should remove peer from all rooms on disconnect", () => {
      roomManager.addPeer("room1", mockSocket.id);
      const mockBroadcast = { emit: jest.fn() };
      mockSocket.to = jest.fn().mockReturnValue(mockBroadcast);

      socketHandler.registerHandlers(mockSocket as any);
      const disconnectHandler = mockSocket.on.mock.calls[6][1] as () => void;

      disconnectHandler();

      const peers = roomManager.getPeers("room1");
      expect(peers).not.toContain(mockSocket.id);
    });
  });
});
