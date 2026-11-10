/**
 * PRUEBAS AUTOMÁTICAS DE LA FASE C: INTEGRACIÓN DE GEMINI Y VALIDADOR
 * 
 * Se ejecutan con: `npm test` o `node --experimental-strip-types --test src/tests/geminiIntegration.test.mjs`
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { GeminiQuotaTracker } from '../data/cache/geminiQuotaTracker.ts';
import { GeminiValidator } from '../data/services/geminiValidator.ts';
import { GeminiService } from '../data/services/geminiService.ts';

test('1. Control de Cuota Diaria de Gemini (GeminiQuotaTracker)', async (t) => {
  await t.test('debe devolver un estado de cuota válido con límite configurable', () => {
    const status = GeminiQuotaTracker.getStatus();
    assert.ok(status.dailyLimit >= 1);
    assert.ok(typeof status.consumedToday === 'number');
    assert.ok(typeof status.remainingToday === 'number');
    assert.equal(typeof status.isBlocked, 'boolean');
  });

  await t.test('canMakeCall debe devolver true si quedan peticiones', () => {
    const can = GeminiQuotaTracker.canMakeCall();
    const status = GeminiQuotaTracker.getStatus();
    assert.equal(can, !status.isBlocked);
  });
});

test('2. Validador Anti-Alucinaciones y Esquema JSON (GeminiValidator)', async (t) => {
  const allowedNumbers = [52, 24, 24, 1.9, 1.1, 60, 40, 2.0, 1.0];

  await t.test('debe aprobar un JSON que cumple el esquema y contiene números permitidos', () => {
    const validJson = JSON.stringify({
      resumen: 'Real Madrid tiene una probabilidad del 52% según el modelo.',
      porQue: [
        'Presenta una media anotada de 2.0 goles.',
        'El marcador esperado es de 1.9 a 1.1.',
      ],
      mercados: [
        {
          mercado: 'Victoria Local',
          probModelo: 52,
          cuotaJusta: 1.92,
          cuotaReal: null,
          lectura: 'Favorito claro.',
        },
      ],
      riesgos: ['No se consideran lesiones de último minuto.'],
      confianza: 'baja', // La IA intenta decir 'baja'
      aviso: 'Estimación estadística, no resultado seguro.',
    });

    // Pasamos confianza del código = 'alta'
    const result = GeminiValidator.validate(validJson, allowedNumbers, 'alta');
    assert.equal(result.isValid, true);
    assert.ok(result.sanitizedData);
    // Debe respetar la confianza del código ('alta'), NO la de la IA
    assert.equal(result.sanitizedData.confianza, 'alta');
    assert.equal(result.sanitizedData.aviso, 'Estimación estadística, no resultado seguro.');
  });

  await t.test('debe rechazar un JSON con números inventados (filtro anti-alucinaciones)', () => {
    const fakeNumbersJson = JSON.stringify({
      resumen: 'Real Madrid tiene un 89.7% de probabilidades ficticias de ganar.',
      porQue: ['Promedia 7.8 goles inventados por partido.'],
      mercados: [
        {
          mercado: '1X2',
          probModelo: 89.7,
          cuotaJusta: 1.11,
          cuotaReal: null,
          lectura: 'Victoria segura',
        },
      ],
      riesgos: ['Riesgo estándar'],
    });

    const result = GeminiValidator.validate(fakeNumbersJson, allowedNumbers, 'alta');
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Alucinación numérica detectada/);
  });

  await t.test('debe limpiar bloques markdown ```json ... ``` correctamente', () => {
    const wrapped = '```json\n{"resumen":"Partido parejo con 52% local.","porQue":["Datos de 2.0 goles."],"mercados":[{"mercado":"1X2","probModelo":52,"cuotaJusta":1.92,"cuotaReal":null,"lectura":"Lectura"}],"riesgos":["Riesgos"]}\n```';
    const result = GeminiValidator.validate(wrapped, allowedNumbers, 'media');
    assert.equal(result.isValid, true);
  });

  await t.test('debe rechazar respuestas con sintaxis JSON inválida', () => {
    const badJson = 'Texto libre sin formato JSON válido';
    const result = GeminiValidator.validate(badJson, allowedNumbers, 'alta');
    assert.equal(result.isValid, false);
    assert.match(result.error || '', /Error al parsear el JSON/);
  });
});

test('3. Motor de Consenso Dual (Gemini + Llama 3.3)', async (t) => {
  await t.test('debe identificar pronósticos coincidentes y marcarlos como consenso', () => {
    const geminiData = {
      resumen: 'Real Madrid dominará el encuentro con alta posesión.',
      porQue: ['Promedia 2.4 goles por partido en casa.'],
      mercados: [
        {
          mercado: 'Real Madrid gana',
          categoria: 'main',
          probModelo: 68,
          cuotaReal: 1.45,
          casaApuesta: 'Bet365',
          lectura: 'Favorito claro.',
        },
        {
          mercado: 'Más de 8.5 córners',
          categoria: 'corners',
          probModelo: 62,
          cuotaReal: 1.65,
          casaApuesta: 'Bet365',
          lectura: 'Ambos equipos generan volumen en bandas.',
        },
      ],
      riesgos: ['Rotaciones por partido europeo intersemanal.'],
      confianza: 'alta',
      aviso: 'Estimación estadística, no resultado seguro.',
      textoCompleto: 'Texto completo.',
      isAiGenerated: true,
    };

    const llamaData = {
      resumen: 'El Real Madrid tiene una ventaja clara según las métricas ofensivas.',
      porQue: ['Rachas recientes favorables.'],
      mercados: [
        {
          mercado: 'Real Madrid gana',
          categoria: 'main',
          probModelo: 72,
          cuotaReal: 1.45,
          casaApuesta: 'Bet365',
          lectura: 'Supera al rival en efectividad.',
        },
        {
          mercado: 'Ambos Marcan - Sí',
          categoria: 'main',
          probModelo: 55,
          cuotaReal: 1.80,
          casaApuesta: 'Winamax',
          lectura: 'Defensas con concesiones.',
        },
      ],
      riesgos: ['Meteorología adversa.'],
      confianza: 'alta',
      aviso: 'Estimación estadística, no resultado seguro.',
      textoCompleto: 'Texto completo.',
      isAiGenerated: true,
    };

    const merged = GeminiService.mergeConsensus(geminiData, llamaData, 'alta');

    assert.ok(merged);
    assert.ok(merged.consensusInfo);
    assert.equal(merged.consensusInfo.modelsAgreed.length, 2);
    // El mercado 'Real Madrid gana' coincidió en ambas IAs
    const winMarket = merged.mercados.find((m) => m.mercado.includes('Real Madrid'));
    assert.ok(winMarket, 'Debe incluir el mercado de victoria del Real Madrid');
    assert.equal(winMarket?.isConsensus, true, 'El mercado coincidente debe tener isConsensus = true');
    // La probabilidad promedio de 68 y 72 es 70
    assert.equal(winMarket?.probModelo, 70);
    // El resumen debe destacar el consenso
    assert.match(merged.resumen, /Consenso/);
  });
});

