import { NextResponse } from 'next/server';
import { SportsRepository } from '@/data/sportsRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await SportsRepository.getMatchById(id);

  if (!data.match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}
