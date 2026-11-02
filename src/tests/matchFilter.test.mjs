import test from 'node:test';
import assert from 'node:assert/strict';
import { hasMatchStarted, filterBettableMatches } from '../core/utils/matchFilter.ts';

function createDummyMatch(overrides = {}) {
  return {
    id: 'test-1',
    sport: 'football',
    league: { id: 'esp.1', name: 'LaLiga EA Sports', country: 'España', season: '2026/2027' },
    date: '2026-11-02',
    time: '21:00',
    status: 'scheduled',
    homeTeam: { id: 'team-a', name: 'Equipo A', shortName: 'EAA', sport: 'football' },
    awayTeam: { id: 'team-b', name: 'Equipo B', shortName: 'EBB', sport: 'football' },
    dataAvailability: {
      sourceName: 'Test',
      lastUpdated: 'Ahora',
      sampleSize: 10,
      isSampleSufficient: true,
      missingFields: [],
    },
    frequencies5: { home: {}, away: {} },
    frequencies10: { home: {}, away: {} },
    probabilities: { homeWinProb: 40, drawProb: 30, awayWinProb: 30 },
    headToHead: [],
    metrics: [],
    ...overrides,
  };
}

test('1. Comprobación de partidos comenzados por estado directo', () => {
  const liveMatch = createDummyMatch({ status: 'live' });
  const finishedMatch = createDummyMatch({ status: 'finished' });
  const scheduledMatch = createDummyMatch({ status: 'scheduled', kickoffTimestamp: Date.now() + 100000 });

  assert.equal(hasMatchStarted(liveMatch), true, 'Un partido live debe considerarse comenzado');
  assert.equal(hasMatchStarted(finishedMatch), true, 'Un partido finished debe considerarse comenzado');
  assert.equal(hasMatchStarted(scheduledMatch), false, 'Un partido scheduled con timestamp futuro no ha comenzado');
});

test('2. Comprobación por kickoffTimestamp', () => {
  const now = 1793650000000;
  const pastMatch = createDummyMatch({ kickoffTimestamp: now - 5000 });
  const exactMatch = createDummyMatch({ kickoffTimestamp: now });
  const futureMatch = createDummyMatch({ kickoffTimestamp: now + 5000 });

  assert.equal(hasMatchStarted(pastMatch, now), true, 'Timestamp en el pasado ha comenzado');
  assert.equal(hasMatchStarted(exactMatch, now), true, 'Timestamp en la hora exacta ha comenzado');
  assert.equal(hasMatchStarted(futureMatch, now), false, 'Timestamp en el futuro no ha comenzado');
});

test('3. Comprobación por fallback de fecha y hora', () => {
  // 2026-11-02 a las 21:00 (hora local)
  const nowAfter = new Date(2026, 10, 2, 21, 5).getTime();
  const nowBefore = new Date(2026, 10, 2, 20, 55).getTime();

  const match = createDummyMatch({
    date: '2026-11-02',
    time: '21:00',
    kickoffTimestamp: undefined,
  });

  assert.equal(hasMatchStarted(match, nowAfter), true, 'A las 21:05, el partido de las 21:00 ya ha comenzado');
  assert.equal(hasMatchStarted(match, nowBefore), false, 'A las 20:55, el partido de las 21:00 todavía no ha comenzado');
});

test('4. Filtrado de partidos apostables (filterBettableMatches)', () => {
  const now = 1793650000000;
  const list = [
    createDummyMatch({ id: 'past-1', status: 'finished' }),
    createDummyMatch({ id: 'past-2', kickoffTimestamp: now - 1000 }),
    createDummyMatch({ id: 'live-1', status: 'live' }),
    createDummyMatch({ id: 'upcoming-1', kickoffTimestamp: now + 60000 }),
    createDummyMatch({ id: 'upcoming-2', kickoffTimestamp: now + 120000 }),
  ];

  const bettable = filterBettableMatches(list, now);
  assert.equal(bettable.length, 2, 'Solo deben quedar 2 partidos en los que todavía se puede apostar');
  assert.equal(bettable[0].id, 'upcoming-1');
  assert.equal(bettable[1].id, 'upcoming-2');
});
