import { Validator } from "../src/utils/validator";
import { describe, it, expect } from "@jest/globals";

describe("Validator", () => {
  describe("validateRoomId", () => {
    it("should validate a valid room ID", () => {
      expect(Validator.validateRoomId("room1")).toBe(true);
      expect(Validator.validateRoomId("my-awesome-room")).toBe(true);
    });

    it("should reject non-string room IDs", () => {
      expect(Validator.validateRoomId(123)).toBe(false);
      expect(Validator.validateRoomId(null)).toBe(false);
      expect(Validator.validateRoomId(undefined)).toBe(false);
    });

    it("should reject empty room IDs", () => {
      expect(Validator.validateRoomId("")).toBe(false);
      expect(Validator.validateRoomId("   ")).toBe(false);
    });

    it("should reject room IDs longer than 100 characters", () => {
      const longId = "a".repeat(101);
      expect(Validator.validateRoomId(longId)).toBe(false);
    });

    it("should accept room IDs exactly 100 characters", () => {
      const id = "a".repeat(100);
      expect(Validator.validateRoomId(id)).toBe(true);
    });
  });

  describe("validateTransportId", () => {
    it("should validate a valid transport ID", () => {
      expect(Validator.validateTransportId("transport-123")).toBe(true);
    });

    it("should reject non-string transport IDs", () => {
      expect(Validator.validateTransportId(123)).toBe(false);
    });

    it("should reject empty transport IDs", () => {
      expect(Validator.validateTransportId("")).toBe(false);
    });
  });

  describe("validateProducerId", () => {
    it("should validate a valid producer ID", () => {
      expect(Validator.validateProducerId("producer-123")).toBe(true);
    });

    it("should reject non-string producer IDs", () => {
      expect(Validator.validateProducerId(123)).toBe(false);
    });

    it("should reject empty producer IDs", () => {
      expect(Validator.validateProducerId("")).toBe(false);
    });
  });

  describe("validateKind", () => {
    it("should accept 'audio' as valid kind", () => {
      expect(Validator.validateKind("audio")).toBe(true);
    });

    it("should accept 'video' as valid kind", () => {
      expect(Validator.validateKind("video")).toBe(true);
    });

    it("should reject non-string kinds", () => {
      expect(Validator.validateKind(123)).toBe(false);
    });

    it("should reject invalid kind values", () => {
      expect(Validator.validateKind("data")).toBe(false);
      expect(Validator.validateKind("")).toBe(false);
    });
  });

  describe("validateDtlsParameters", () => {
    it("should validate correct DTLS parameters", () => {
      const params = {
        role: "client",
        fingerprints: [{ algorithm: "sha-256", value: "abcd" }],
      };
      expect(Validator.validateDtlsParameters(params)).toBe(true);
    });

    it("should reject non-object parameters", () => {
      expect(Validator.validateDtlsParameters("not-an-object")).toBe(false);
      expect(Validator.validateDtlsParameters(null)).toBe(false);
    });

    it("should reject parameters without role", () => {
      const params = {
        fingerprints: [{ algorithm: "sha-256", value: "abcd" }],
      };
      expect(Validator.validateDtlsParameters(params)).toBe(false);
    });

    it("should reject parameters without fingerprints", () => {
      const params = { role: "client" };
      expect(Validator.validateDtlsParameters(params)).toBe(false);
    });
  });

  describe("validateRtpParameters", () => {
    it("should validate RTP parameters object", () => {
      const params = { codecs: [], headerExtensions: [] };
      expect(Validator.validateRtpParameters(params)).toBe(true);
    });

    it("should reject non-object parameters", () => {
      expect(Validator.validateRtpParameters("not-an-object")).toBe(false);
      expect(Validator.validateRtpParameters(null)).toBe(false);
    });

    it("should reject undefined parameters", () => {
      expect(Validator.validateRtpParameters(undefined)).toBe(false);
    });
  });
});
