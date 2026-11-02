/**
 * MONITOR Y BLOQUEO PREVENTIVO DE CUOTA DE API
 * 
 * Principio de seguridad para el usuario:
 * Las APIs externas cobran o suspenden cuentas si se superan los límites diarios.
 * Este módulo rastrea las peticiones del día actual, las guarda en disco
 * y BLOQUEA cualquier llamada saliente antes de sobrepasar el límite asignado en .env.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ApiQuotaStatus } from '../../core/models.ts';
import { logInfo, logError } from '../logger.ts';

const STORE_DIR = path.join(process.cwd(), 'data', 'cache', 'store');
const QUOTA_FILE = path.join(STORE_DIR, 'quota.json');

interface StoredQuota {
  date: string; // YYYY-MM-DD
  consumed: number;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function readStoredQuota(): StoredQuota {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    if (fs.existsSync(QUOTA_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
      if (data.date === getTodayString()) {
        return data;
      }
    }
  } catch (err) {
    logError('readStoredQuota', err);
  }
  // Si no existe o es de un día anterior, reiniciar a cero
  return { date: getTodayString(), consumed: 0 };
}

function saveStoredQuota(data: StoredQuota): void {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    logError('saveStoredQuota', err);
  }
}

export class QuotaTracker {
  private static getLimit(): number {
    return Number(process.env.DAILY_QUOTA_LIMIT) || 100;
  }

  /**
   * Obtiene el estado actual de consumo de la API.
   */
  public static getStatus(): ApiQuotaStatus {
    const quota = readStoredQuota();
    const limit = this.getLimit();
    const remaining = Math.max(0, limit - quota.consumed);
    const percentage = Math.min(100, Math.round((quota.consumed / limit) * 100));

    return {
      dailyLimit: limit,
      consumedToday: quota.consumed,
      remainingToday: remaining,
      percentageUsed: percentage,
      isBlockedDueToLimit: quota.consumed >= limit,
      lastResetTime: `${quota.date} 00:00 UTC`,
    };
  }

  /**
   * Comprueba si es seguro realizar una petición y la registra en el contador.
   * Lanza un error controlado si se ha alcanzado el límite.
   */
  public static recordApiCall(): void {
    const quota = readStoredQuota();
    const limit = this.getLimit();

    if (quota.consumed >= limit) {
      const msg = `Límite diario de seguridad alcanzado (${quota.consumed}/${limit}). Petición bloqueada para proteger la cuota.`;
      logError('QuotaTracker:recordApiCall', new Error(msg));
      throw new Error(msg);
    }

    quota.consumed += 1;
    saveStoredQuota(quota);
    logInfo('QuotaTracker', `Petición registrada: ${quota.consumed}/${limit}`);
  }

  /**
   * Permite reiniciar manualmente el contador para pruebas.
   */
  public static resetQuotaForTesting(): void {
    saveStoredQuota({ date: getTodayString(), consumed: 0 });
  }
}
