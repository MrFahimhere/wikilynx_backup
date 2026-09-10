import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const ALLOWED_LEVELS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'] as const;
const ALLOWED_DIFFICULTIES = [1, 2, 3, 4] as const;
const ALLOWED_STATUSES = ['Win', 'Loss'] as const;

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { username, level, difficulty, time_taken, clicks, checkpoints, status } = body;

    // 1. Validate username: non-empty string after trimming
    if (typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Username must be a non-empty string' },
        { status: 400 }
      );
    }

    // 2. Validate level: Level 1, Level 2, Level 3, or Level 4
    if (typeof level !== 'string' || !ALLOWED_LEVELS.includes(level as any)) {
      return NextResponse.json(
        {
          success: false,
          error: "Level must be one of: 'Level 1', 'Level 2', 'Level 3', 'Level 4'",
        },
        { status: 400 }
      );
    }

    // 3. Validate difficulty: integer 1–4
    if (
      typeof difficulty !== 'number' ||
      !Number.isInteger(difficulty) ||
      !ALLOWED_DIFFICULTIES.includes(difficulty as any)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Difficulty must be an integer from 1 to 4 (1, 2, 3, or 4)',
        },
        { status: 400 }
      );
    }

    // 4. Validate time_taken: finite number >= 0
    if (
      typeof time_taken !== 'number' ||
      !Number.isFinite(time_taken) ||
      time_taken < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Time taken must be a finite number greater than or equal to 0' },
        { status: 400 }
      );
    }

    // 5. Validate clicks: integer >= 0
    if (
      typeof clicks !== 'number' ||
      !Number.isInteger(clicks) ||
      clicks < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Clicks must be an integer greater than or equal to 0' },
        { status: 400 }
      );
    }

    // 6. Validate checkpoints: integer >= 0
    if (
      typeof checkpoints !== 'number' ||
      !Number.isInteger(checkpoints) ||
      checkpoints < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Checkpoints must be an integer greater than or equal to 0' },
        { status: 400 }
      );
    }

    // 7. Validate status: Win or Loss
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status as any)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status must be either 'Win' or 'Loss'",
        },
        { status: 400 }
      );
    }

    // FINAL SCORING FORMULA:
    // Base = max(100.0, 10000.0 - (10.0 × T) - (100.0 × C)) + (checkpoints × 250.0)
    // Score = round(M_diff × Base)
    // Note: level does NOT affect score; status does NOT affect score.
    const baseScore =
      Math.max(100, 10000 - 10 * time_taken - 100 * clicks) +
      (checkpoints * 250);

    const calculatedScore = Math.round(difficulty * baseScore);

    // Insert into public.scores
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          username: username.trim(),
          level,
          difficulty,
          time_taken,
          clicks,
          checkpoints,
          status,
          score: calculatedScore,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase database insert error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit score to database',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        result: data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/scores:', err?.message || err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
