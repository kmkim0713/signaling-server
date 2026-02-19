/**
 * 모든 타입 정의 - discriminated union 패턴 사용
 */

// ============= SFU 서버 응답 타입 =============

export interface ProducerInfo {
  peerId: string;
  producerId: string;
  kind: string;
}

export interface ExistingProducersResponse {
  producers: ProducerInfo[];
}

export interface RtpCapabilitiesResponse {
  codecs: Array<{
    kind: string;
    mimeType: string;
    preferredPayloadType?: number;
    clockRate: number;
    channels?: number;
    rtcpFeedback?: Array<{ type: string; parameter?: string }>;
    parameters?: Record<string, unknown>;
  }>;
  headerExtensions: Array<{
    kind: string;
    uri: string;
    preferredId: number;
    preferredEncrypt: boolean;
    direction: string;
  }>;
}

export interface TransportResponse {
  id: string;
  iceParameters: {
    usernameFragment: string;
    password: string;
  };
  iceCandidates: Array<{
    foundation: string;
    priority: number;
    ip: string;
    protocol: string;
    port: number;
    type: string;
    tcpType?: string;
    relatedAddress?: string;
    relatedPort?: number;
  }>;
  dtlsParameters: {
    role: string;
    fingerprints: Array<{
      algorithm: string;
      value: string;
    }>;
  };
}

export interface ProduceResponse {
  id: string;
}

export interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: string;
  rtpParameters: Record<string, unknown>;
}

// ============= Socket.IO 클라이언트 → 서버 페이로드 =============

export interface JoinRoomPayload {
  meetingId: string;
  userId: string;
  userName: string;
}

export interface PeerMeta {
  userId: string;
  userName: string;
}

export interface CreateTransportPayload {
  direction?: string;
}

export interface ConnectTransportPayload {
  transportId: string;
  dtlsParameters: {
    role: string;
    fingerprints: Array<{
      algorithm: string;
      value: string;
    }>;
  };
}

export interface ProducePayload {
  transportId: string;
  kind: string;
  rtpParameters: {
    codecs: Array<{
      mimeType: string;
      payloadType: number;
      clockRate: number;
      channels?: number;
      parameters?: Record<string, unknown>;
      rtcpFeedback?: Array<{ type: string; parameter?: string }>;
    }>;
    headerExtensions: Array<{
      uri: string;
      id: number;
      encrypt: boolean;
      parameters?: Record<string, unknown>;
    }>;
    encodings: Array<{
      ssrc?: number;
      rid?: string;
      rtx?: { ssrc: number };
      dtx?: boolean;
      scalabilityMode?: string;
      maxBitrate?: number;
      maxFramerate?: number;
    }>;
    rtcp: {
      cname?: string;
      reducedSize?: boolean;
      mux?: boolean;
    };
  };
}

export interface ConsumePayload {
  transportId: string;
  producerId: string;
  kind: string;
}

// ============= Socket.IO 서버 → 클라이언트 이벤트 =============

export interface NewConsumerEvent {
  producerId: string;
  id: string;
  kind: string;
  userId: string;
  userName: string;
}

export interface PeerDisconnectedEvent {
  peerId: string;
}

// ============= 에러 응답 =============

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

// ============= 로깅 레벨 =============

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}
