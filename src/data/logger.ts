/**
 * REGISTRO CENTRALIZADO DE ERRORES Y ACTIVIDAD (LOGGER)
 * 
 * Guarda los errores técnicos en un archivo local (logs/app-errors.log)
 * para que no se pierda ningún fallo y el usuario pueda consultarlo sin consola.
 */

import fs from 'node:fs';
import path from 'node:path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'app-errors.log');

export function logError(context: string, error: unknown): void {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    const entry = `[${timestamp}] [ERROR] [${context}]: ${errorMessage}\n----------------------------------------\n`;

    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch (fsErr) {
    // Si falla el archivo, emitir en consola sin bloquear la ejecución
    console.error(`[Logger Failure] No se pudo escribir en log:`, fsErr);
  }
}

export function logInfo(context: string, message: string): void {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [INFO] [${context}]: ${message}\n`;
    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch {
    // Silencioso
  }
}

export function getRecentLogs(maxLines: number = 50): string[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return ['No hay errores registrados hasta la fecha.'];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    return lines.slice(-maxLines);
  } catch {
    return ['Error al leer el archivo de registros.'];
  }
}
