import { RoomManager } from "../src/rooms/room-manager";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("RoomManager", () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe("addPeer", () => {
    it("should add a peer to a room", () => {
      roomManager.addPeer("room1", "peer1");
      const peers = roomManager.getPeers("room1");
      expect(peers).toContain("peer1");
      expect(peers.length).toBe(1);
    });

    it("should add multiple peers to the same room", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      const peers = roomManager.getPeers("room1");
      expect(peers).toContain("peer1");
      expect(peers).toContain("peer2");
      expect(peers.length).toBe(2);
    });

    it("should create a room if it does not exist", () => {
      roomManager.addPeer("new-room", "peer1");
      expect(roomManager.getPeerCount("new-room")).toBe(1);
    });
  });

  describe("removePeer", () => {
    it("should remove a peer from all rooms", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      const removedRooms = roomManager.removePeer("peer1");
      expect(removedRooms).toContain("room1");
      expect(roomManager.getPeers("room1")).not.toContain("peer1");
    });

    it("should return empty array if peer not found", () => {
      const removedRooms = roomManager.removePeer("non-existent");
      expect(removedRooms).toEqual([]);
    });

    it("should delete empty rooms", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.removePeer("peer1");
      expect(roomManager.getPeerCount("room1")).toBe(0);
    });
  });

  describe("getPeers", () => {
    it("should return all peers in a room", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      const peers = roomManager.getPeers("room1");
      expect(peers.length).toBe(2);
    });

    it("should exclude specified peer", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      const peers = roomManager.getPeers("room1", "peer1");
      expect(peers).toContain("peer2");
      expect(peers).not.toContain("peer1");
    });

    it("should return empty array for non-existent room", () => {
      expect(roomManager.getPeers("non-existent")).toEqual([]);
    });
  });

  describe("getRoomId", () => {
    it("should return the room ID for a peer", () => {
      roomManager.addPeer("room1", "peer1");
      const roomId = roomManager.getRoomId("peer1");
      expect(roomId).toBe("room1");
    });

    it("should return undefined for non-existent peer", () => {
      const roomId = roomManager.getRoomId("non-existent");
      expect(roomId).toBeUndefined();
    });
  });

  describe("hasPeer", () => {
    it("should return true if peer is in room", () => {
      roomManager.addPeer("room1", "peer1");
      expect(roomManager.hasPeer("room1", "peer1")).toBe(true);
    });

    it("should return false if peer is not in room", () => {
      roomManager.addPeer("room1", "peer1");
      expect(roomManager.hasPeer("room1", "peer2")).toBe(false);
    });
  });

  describe("getPeerCount", () => {
    it("should return correct peer count", () => {
      roomManager.addPeer("room1", "peer1");
      roomManager.addPeer("room1", "peer2");
      expect(roomManager.getPeerCount("room1")).toBe(2);
    });

    it("should return 0 for non-existent room", () => {
      expect(roomManager.getPeerCount("non-existent")).toBe(0);
    });
  });
});
