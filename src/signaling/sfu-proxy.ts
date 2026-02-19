import axios from "axios";
import {
  ExistingProducersResponse,
  RtpCapabilitiesResponse,
  TransportResponse,
  ProduceResponse,
  ConsumeResponse,
  ConnectTransportPayload,
  ProducePayload,
  ConsumePayload,
} from "../types/index";
import { Logger } from "../utils/logger";

/**
 * SFU 서버 프록시
 * 클라이언트 요청을 SFU 서버로 중계
 */
export class SfuProxy {
  private sfuServer: string;

  constructor(sfuServerUrl: string) {
    this.sfuServer = sfuServerUrl;
  }

  /**
   * 기존 Producer 목록 조회
   */
  async getExistingProducers(peerId: string): Promise<ExistingProducersResponse> {
    try {
      const response = await axios.get<ExistingProducersResponse>(
        `${this.sfuServer}/peer-producers?peerId=${peerId}`
      );
      return response.data;
    } catch (error) {
      Logger.error("Failed to get existing producers", {
        peerId,
        error: this.extractErrorMessage(error),
      });
      throw error;
    }
  }

  /**
   * RTP Capabilities 조회
   */
  async getRtpCapabilities(): Promise<RtpCapabilitiesResponse> {
    try {
      const response = await axios.get<RtpCapabilitiesResponse>(`${this.sfuServer}/rtp-capabilities`);
      return response.data;
    } catch (error) {
      Logger.error("Failed to get RTP capabilities", { error: this.extractErrorMessage(error) });
      throw error;
    }
  }

  /**
   * WebRTC Transport 생성
   */
  async createTransport(peerId: string): Promise<TransportResponse> {
    try {
      const response = await axios.post<TransportResponse>(`${this.sfuServer}/create-web-rtc-transport`, {
        peerId,
      });
      return response.data;
    } catch (error) {
      Logger.error("Failed to create transport", { peerId, error: this.extractErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Transport 연결 (DTLS handshake)
   */
  async connectTransport(params: ConnectTransportPayload, peerId: string): Promise<void> {
    try {
      await axios.post(`${this.sfuServer}/connect-transport`, {
        transportId: params.transportId,
        dtlsParameters: params.dtlsParameters,
        peerId,
      });
    } catch (error) {
      Logger.error("Failed to connect transport", {
        peerId,
        transportId: params.transportId,
        error: this.extractErrorMessage(error),
      });
      throw error;
    }
  }

  /**
   * 미디어 송출 (Produce)
   */
  async produce(params: ProducePayload, peerId: string): Promise<ProduceResponse> {
    try {
      const response = await axios.post<ProduceResponse>(`${this.sfuServer}/produce`, {
        transportId: params.transportId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
        peerId,
      });
      return response.data;
    } catch (error) {
      Logger.error("Failed to produce", {
        peerId,
        kind: params.kind,
        error: this.extractErrorMessage(error),
      });
      throw error;
    }
  }

  /**
   * 미디어 수신 (Consume)
   */
  async consume(params: ConsumePayload, peerId: string): Promise<ConsumeResponse> {
    try {
      const response = await axios.post<ConsumeResponse>(`${this.sfuServer}/consume`, {
        transportId: params.transportId,
        producerId: params.producerId,
        kind: params.kind,
        peerId,
      });
      return response.data;
    } catch (error) {
      Logger.error("Failed to consume", {
        peerId,
        producerId: params.producerId,
        error: this.extractErrorMessage(error),
      });
      throw error;
    }
  }

  /**
   * 에러 메시지 추출
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
