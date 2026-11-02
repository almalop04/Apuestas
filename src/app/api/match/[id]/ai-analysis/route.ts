import { NextRequest, NextResponse } from 'next/server';
import { SportsRepository } from '@/data/sportsRepository';
import { GeminiService } from '@/data/services/geminiService';
import { GeminiQuotaTracker } from '@/data/cache/geminiQuotaTracker';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID de partido no especificado' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Obtener la ficha oficial del partido
    const { match } = await SportsRepository.getMatchById(id);
    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado o no disponible' },
        { status: 404 }
      );
    }

    // 2. Ejecutar el análisis (Gemini o Explicador de respaldo)
    const result = await GeminiService.analyzeMatch(match, forceRefresh);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Error interno al procesar el análisis',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return GET(request, context);
}

