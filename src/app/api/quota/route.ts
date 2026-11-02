import { NextResponse } from 'next/server';
import { SportsRepository } from '@/data/sportsRepository';

export async function GET() {
  const quota = SportsRepository.getQuotaStatus();
  return NextResponse.json(quota);
}
