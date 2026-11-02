import { NextResponse } from 'next/server';
import { SportsRepository } from '@/data/sportsRepository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await SportsRepository.getTeamById(id);

  if (!data.teamData) {
    return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}
