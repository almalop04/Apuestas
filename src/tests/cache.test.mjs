/**
 * PRUEBAS AUTOMÁTICAS DE CACHÉ Y MONITOR DE CUOTA
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheManager } from '../data/cache/cacheManager.ts';
import { QuotaTracker } from '../data/cache/quotaTracker.ts';

test('1. Gestor de Caché Local (TTL)', async (t) => {
  await t.test('guarda y recupera un dato antes de su expiración', () => {
    const key = 'test_key_valid';
    const testData = { name: 'Real Madrid', goals: 3 };
    CacheManager.set(key, testData, 60); // 60 segundos TTL

    const retrieved = CacheManager.get(key);
    assert.deepEqual(retrieved, testData);
  });

  await t.test('invalida correctamente un dato borrado', () => {
    const key = 'test_key_delete';
    CacheManager.set(key, { temp: true }, 60);
    CacheManager.invalidate(key);

    const retrieved = CacheManager.get(key);
    assert.equal(retrieved, null);
  });
});

test('2. Monitor y Bloqueo de Cuota Diaria (Quota Tracker)', async (t) => {
  // Reiniciar estado para la prueba
  QuotaTracker.resetQuotaForTesting();

  await t.test('el estado inicial tiene 0 peticiones gastadas', () => {
    const status = QuotaTracker.getStatus();
    assert.equal(status.consumedToday, 0);
    assert.equal(status.isBlockedDueToLimit, false);
    assert.ok(status.remainingToday > 0);
  });

  await t.test('registra una llamada e incrementa el contador', () => {
    QuotaTracker.recordApiCall();
    const status = QuotaTracker.getStatus();
    assert.equal(status.consumedToday, 1);
    assert.equal(status.remainingToday, status.dailyLimit - 1);
  });
});
