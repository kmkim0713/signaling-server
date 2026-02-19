import { Logger } from "../utils/logger";

/**
 * 방 관리자
 * 룸 생명주기 및 피어 추적 담당
 */
export class RoomManager {
  private rooms: Map<string, Set<string>> = new Map();

  /**
   * 방에 피어 추가
   * @param roomId 방 ID
   * @param socketId 소켓 ID (피어 고유 식별자)
   */
  addPeer(roomId: string, socketId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socketId);
    Logger.info("Peer joined room", { roomId, socketId, peerCount: this.rooms.get(roomId)!.size });
  }

  /**
   * 피어 제거 (피어가 속한 모든 방에서 제거)
   * @param socketId 소켓 ID
   * @returns 제거된 roomId 배열
   */
  removePeer(socketId: string): string[] {
    const removedRooms: string[] = [];

    for (const [roomId, peers] of this.rooms.entries()) {
      if (peers.has(socketId)) {
        peers.delete(socketId);
        removedRooms.push(roomId);

        // 방이 비어있으면 삭제
        if (peers.size === 0) {
          this.rooms.delete(roomId);
          Logger.info("Room deleted (empty)", { roomId });
        } else {
          Logger.info("Peer left room", { roomId, socketId, peerCount: peers.size });
        }
      }
    }

    return removedRooms;
  }

  /**
   * 방의 모든 피어 조회 (본인 제외)
   * @param roomId 방 ID
   * @param excludeSocketId 제외할 피어 ID (보통 본인)
   * @returns 피어 ID 배열
   */
  getPeers(roomId: string, excludeSocketId?: string): string[] {
    const peers = this.rooms.get(roomId);
    if (!peers) return [];

    if (excludeSocketId) {
      return Array.from(peers).filter((id) => id !== excludeSocketId);
    }
    return Array.from(peers);
  }

  /**
   * 피어가 속한 방 ID 조회
   * @param socketId 소켓 ID
   * @returns 방 ID 또는 undefined
   */
  getRoomId(socketId: string): string | undefined {
    for (const [roomId, peers] of this.rooms.entries()) {
      if (peers.has(socketId)) {
        return roomId;
      }
    }
    return undefined;
  }

  /**
   * 피어가 방에 속하는지 확인
   * @param roomId 방 ID
   * @param socketId 소켓 ID
   * @returns boolean
   */
  hasPeer(roomId: string, socketId: string): boolean {
    const peers = this.rooms.get(roomId);
    return peers ? peers.has(socketId) : false;
  }

  /**
   * 방의 피어 수 조회
   * @param roomId 방 ID
   * @returns 피어 수
   */
  getPeerCount(roomId: string): number {
    return this.rooms.get(roomId)?.size ?? 0;
  }
}
