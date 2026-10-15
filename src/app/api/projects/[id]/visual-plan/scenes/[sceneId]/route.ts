import { NextResponse } from 'next/server';
import { getScriptScene, updateScriptScene } from '@/lib/database/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();

    const existing = getScriptScene(sceneId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Scene not found' },
        { status: 404 }
      );
    }

    const updated = updateScriptScene(sceneId, body);

    return NextResponse.json({
      success: true,
      scene: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update scene' },
      { status: 500 }
    );
  }
}
