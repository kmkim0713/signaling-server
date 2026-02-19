import { LogLevel, LogEntry } from "../types/index";

/**
 * 구조화 로깅 유틸리티
 * console.log 사용 금지 - 이 Logger 사용
 */
export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
    };

    const output = data
      ? `[${entry.timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`
      : `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  static info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  static warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  static error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  static debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }
}
