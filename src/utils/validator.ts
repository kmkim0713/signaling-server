/**
 * 메시지 유효성 검사 유틸리티
 * 모든 클라이언트 입력 검증 필수
 */

export class Validator {
  /**
   * roomId 유효성 검증
   * - 비어있지 않음
   * - 문자열
   * - 최대 100글자
   */
  static validateRoomId(roomId: unknown): roomId is string {
    if (typeof roomId !== "string") return false;
    if (roomId.trim().length === 0) return false;
    if (roomId.length > 100) return false;
    return true;
  }

  /**
   * transportId 유효성 검증
   */
  static validateTransportId(transportId: unknown): transportId is string {
    if (typeof transportId !== "string") return false;
    if (transportId.trim().length === 0) return false;
    return true;
  }

  /**
   * producerId 유효성 검증
   */
  static validateProducerId(producerId: unknown): producerId is string {
    if (typeof producerId !== "string") return false;
    if (producerId.trim().length === 0) return false;
    return true;
  }

  /**
   * kind 유효성 검증 (audio 또는 video)
   */
  static validateKind(kind: unknown): kind is string {
    if (typeof kind !== "string") return false;
    return kind === "audio" || kind === "video";
  }

  /**
   * dtlsParameters 유효성 검증
   */
  static validateDtlsParameters(params: unknown): params is Record<string, unknown> {
    if (typeof params !== "object" || params === null) return false;
    const obj = params as Record<string, unknown>;
    if (typeof obj.role !== "string") return false;
    if (!Array.isArray(obj.fingerprints)) return false;
    return true;
  }

  /**
   * rtpParameters 유효성 검증
   */
  static validateRtpParameters(params: unknown): params is Record<string, unknown> {
    if (typeof params !== "object" || params === null) return false;
    return true; // 기본 객체 체크 (상세 검증은 SFU가 담당)
  }
}
