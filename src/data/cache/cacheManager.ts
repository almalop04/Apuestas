/**
 * GESTOR DE CACHÉ LOCAL CON CADUCIDAD (TTL) Y PERSISTENCIA
 * 
 * Principio de eficiencia y coste:
 * Cada llamada a una API consume cuota. Si consultamos un partido terminado,
 * el resultado nunca va a cambiar: se guarda durante 24 horas.
 * Si consultamos estadísticas históricas, duran 7 días.
 * Si es un partido en directo, expira en 60 segundos.
 */

import fs from 'node:fs';
import path from 'node:path';
import { logError } from '../logger.ts';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'store');

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttlSeconds: number;
}

export class CacheManager {
  private static memoryCache = new Map<string, CacheItem<unknown>>();

  private static getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(CACHE_DIR, `cache_${safeKey}.json`);
  }

  /**
   * Obtiene un dato de la caché si no ha caducado.
   */
  public static get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Revisar caché en memoria (ultrarrápida)
    const inMemory = this.memoryCache.get(key) as CacheItem<T> | undefined;
    if (inMemory) {
      if (now - inMemory.timestamp < inMemory.ttlSeconds * 1000) {
        return inMemory.data;
      }
      this.memoryCache.delete(key);
    }

    // 2. Revisar caché persistente en disco
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const item: CacheItem<T> = JSON.parse(content);
        if (now - item.timestamp < item.ttlSeconds * 1000) {
          this.memoryCache.set(key, item);
          return item.data;
        }
        // Ha caducado: borrar archivo
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      logError(`CacheManager:get(${key})`, err);
    }

    return null;
  }

  /**
   * Guarda un dato en la caché con un tiempo de vida (TTL) en segundos.
   */
  public static set<T>(key: string, data: T, ttlSeconds: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttlSeconds,
    };

    // Guardar en memoria
    this.memoryCache.set(key, item);

    // Guardar en disco
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const filePath = this.getFilePath(key);
      fs.writeFileSync(filePath, JSON.stringify(item), 'utf8');
    } catch (err) {
      logError(`CacheManager:set(${key})`, err);
    }
  }

  /**
   * Elimina un elemento de la caché o limpia la memoria.
   */
  public static invalidate(key: string): void {
    this.memoryCache.delete(key);
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      logError(`CacheManager:invalidate(${key})`, err);
    }
  }

  /**
   * Limpia toda la caché en memoria y en disco.
   */
  public static clearAll(): void {
    this.memoryCache.clear();
    try {
      if (fs.existsSync(CACHE_DIR)) {
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
          if (file.startsWith('cache_')) {
            fs.unlinkSync(path.join(CACHE_DIR, file));
          }
        }
      }
    } catch (err) {
      logError('CacheManager:clearAll', err);
    }
  }
}
