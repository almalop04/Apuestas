import { NextResponse } from 'next/server';
import { SportsRepository } from '@/data/sportsRepository';
import type { SportType } from '@/core/models';
import { filterBettableMatches } from '@/core/utils/matchFilter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sportParam = searchParams.get('sport') as SportType | null;
    const modeParam = searchParams.get('mode') as 'live' | 'mock' | null;
    const dayOffsetParam = searchParams.get('dayOffset');
    const onlyUpcomingParam = searchParams.get('onlyUpcoming');
    const dayOffset = dayOffsetParam !== null ? parseInt(dayOffsetParam, 10) : 0;
    const sport: SportType = sportParam === 'basketball' ? 'basketball' : 'football';

    const data = await SportsRepository.getTodayMatches(sport, modeParam || undefined, Number.isNaN(dayOffset) ? 0 : dayOffset);

    if (onlyUpcomingParam === 'true') {
      const filtered = filterBettableMatches(data.matches);
      return NextResponse.json({
        ...data,
        matches: filtered,
        totalOriginal: data.matches.length,
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        matches: [],
        fromCache: false,
        quota: SportsRepository.getQuotaStatus(),
        error: err instanceof Error ? err.message : 'Error al procesar la solicitud de partidos',
      },
      { status: 200 }
    );
  }
}
