/**
 * CONTROL Y CONTADOR DE CUOTA DIARIA PARA GEMINI (PLAN GRATUITO)
 * 
 * Garantiza que nunca se supere el límite diario configurable de llamadas (por defecto 50/día).
 * El contador se reinicia automáticamente cada medianoche en la hora peninsular de España.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface GeminiQuotaStatus {
  dailyLimit: number;
  consumedToday: number;
  remainingToday: number;
  isBlocked: boolean;
  lastResetDate: string;
}

export class GeminiQuotaTracker {
  private static filePath = path.join(process.cwd(), 'data', 'cache', 'store', 'gemini_quota.json');

  private static getTodayStr(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private static loadState(): { date: string; consumed: number } {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.date === this.getTodayStr()) {
          return parsed;
        }
      }
    } catch {
      // Ignorar fallo de lectura y usar nuevo día
    }
    return { date: this.getTodayStr(), consumed: 0 };
  }

  private static saveState(consumed: number) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ date: this.getTodayStr(), consumed }, null, 2),
        'utf-8'
      );
    } catch {
      // Fallback silencioso en entornos restringidos
    }
  }

  public static getStatus(): GeminiQuotaStatus {
    const limit = Number(process.env.GEMINI_DAILY_LIMIT) || 50;
    const state = this.loadState();
    const remaining = Math.max(0, limit - state.consumed);
    const isBlocked = remaining === 0;

    return {
      dailyLimit: limit,
      consumedToday: state.consumed,
      remainingToday: remaining,
      isBlocked,
      lastResetDate: state.date,
    };
  }

  public static canMakeCall(): boolean {
    const status = this.getStatus();
    return !status.isBlocked;
  }

  public static recordCall(): GeminiQuotaStatus {
    const state = this.loadState();
    state.consumed += 1;
    this.saveState(state.consumed);
    return this.getStatus();
  }
}

