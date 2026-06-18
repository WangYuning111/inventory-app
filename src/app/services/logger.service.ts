/**
 * Inventory Management System
 * Developer: Yuning Wang
 * Logger Service - Structured logging for production
 */
import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  context: string;
  message: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private static readonly STORAGE_KEY = 'app_logs';
  private static readonly MAX_LOGS = 200;
  private currentLevel: LogLevel = LogLevel.DEBUG;

  constructor() {}

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  error(context: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data);
  }

  private log(level: LogLevel, context: string, message: string, data?: any): void {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      context,
      message,
      data: data ? this.safeSerialize(data) : undefined,
    };

    // Console output
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(`[${entry.levelName}] ${context}: ${message}`, data || '');

    // Persist to storage
    this.persistLog(entry);
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG: return console.log;
      case LogLevel.INFO: return console.info;
      case LogLevel.WARN: return console.warn;
      case LogLevel.ERROR: return console.error;
      default: return console.log;
    }
  }

  private safeSerialize(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return String(data);
    }
  }

  private persistLog(entry: LogEntry): void {
    try {
      const logs = this.getLogs();
      logs.push(entry);
      if (logs.length > LoggerService.MAX_LOGS) {
        logs.splice(0, logs.length - LoggerService.MAX_LOGS);
      }
      localStorage.setItem(LoggerService.STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore storage errors
    }
  }

  getLogs(): LogEntry[] {
    try {
      const data = localStorage.getItem(LoggerService.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    localStorage.removeItem(LoggerService.STORAGE_KEY);
  }
}
