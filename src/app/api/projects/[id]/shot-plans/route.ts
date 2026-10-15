import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listShotPlansByProject,
  addShotPlan,
  updateShotPlan,
  deleteShotPlan,
  reorderShotPlans,
} from '@/lib/database/db';
import { ShotType, CameraMovement } from '@/lib/types';

const CreateShotPlanSchema = z.object({
  locationId: z.string().optional(),
  relatedReferenceId: z.string().optional(),
  durationSeconds: z.number().int().min(1).max(60).default(8),
  shotType: z.enum([
    'Wide establishing shot',
    'Street-level establishing shot',
    'Slow forward approach',
    'Street or building reveal',
    'Row of terraced houses',
    'Shopfront or local landmark',
    'Coastal establishing shot',
    'Historic site overview',
    'Static documentary shot',
    'Detail shot',
  ]),
  visualObjective: z.string().min(1, 'Visual objective is required'),
  movement: z.enum([
    'Static framing',
    'Slow push-in',
    'Slow pull-back',
    'Gentle pan',
    'Left-to-right reveal',
    'Wide-to-close transition',
  ]),
  scriptExcerpt: z.string().optional(),
  startViewpoint: z.string().optional(),
  endViewpoint: z.string().optional(),
  productionNotes: z.string().optional(),
  preferredSource: z.string().optional(),
  licenceStatus: z.string().optional(),
});

const UpdateShotPlanSchema = z.object({
  action: z.enum(['update', 'reorder']).default('update'),
  id: z.string().optional(),
  orderedIds: z.array(z.string()).optional(),
  durationSeconds: z.number().int().min(1).max(60).optional(),
  shotType: z.string().optional(),
  visualObjective: z.string().optional(),
  movement: z.string().optional(),
  scriptExcerpt: z.string().optional(),
  startViewpoint: z.string().optional(),
  endViewpoint: z.string().optional(),
  productionNotes: z.string().optional(),
  preferredSource: z.string().optional(),
  licenceStatus: z.string().optional(),
  relatedReferenceId: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shots = listShotPlansByProject(id);
    return NextResponse.json({ success: true, shots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list shot plans' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CreateShotPlanSchema.parse(body);

    const existing = listShotPlansByProject(id);
    const sequenceOrder = existing.length + 1;
    const shotId = `shot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newShot = addShotPlan({
      id: shotId,
      projectId: id,
      locationId: parsed.locationId,
      relatedReferenceId: parsed.relatedReferenceId,
      sequenceOrder,
      durationSeconds: parsed.durationSeconds,
      shotType: parsed.shotType as ShotType,
      visualObjective: parsed.visualObjective,
      movement: parsed.movement as CameraMovement,
      scriptExcerpt: parsed.scriptExcerpt,
      startViewpoint: parsed.startViewpoint,
      endViewpoint: parsed.endViewpoint,
      productionNotes: parsed.productionNotes,
      preferredSource: parsed.preferredSource,
      licenceStatus: parsed.licenceStatus,
    });

    return NextResponse.json({ success: true, shot: newShot }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create shot plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateShotPlanSchema.parse(body);

    if (parsed.action === 'reorder') {
      if (!parsed.orderedIds || !Array.isArray(parsed.orderedIds)) {
        return NextResponse.json(
          { success: false, error: 'orderedIds array required for reorder action' },
          { status: 400 }
        );
      }
      reorderShotPlans(id, parsed.orderedIds);
      const updatedList = listShotPlansByProject(id);
      return NextResponse.json({ success: true, shots: updatedList });
    }

    if (!parsed.id) {
      return NextResponse.json({ success: false, error: 'id required for update action' }, { status: 400 });
    }

    const ok = updateShotPlan(parsed.id, {
      durationSeconds: parsed.durationSeconds,
      shotType: parsed.shotType as ShotType | undefined,
      visualObjective: parsed.visualObjective,
      movement: parsed.movement as CameraMovement | undefined,
      scriptExcerpt: parsed.scriptExcerpt,
      startViewpoint: parsed.startViewpoint,
      endViewpoint: parsed.endViewpoint,
      productionNotes: parsed.productionNotes,
      preferredSource: parsed.preferredSource,
      licenceStatus: parsed.licenceStatus,
      relatedReferenceId: parsed.relatedReferenceId ?? undefined,
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Shot plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Shot plan updated' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update shot plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _projectId } = await params;
    const { searchParams } = new URL(request.url);
    const shotId = searchParams.get('shotId');

    if (!shotId) {
      return NextResponse.json({ success: false, error: 'shotId parameter is required' }, { status: 400 });
    }

    const deleted = deleteShotPlan(shotId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Shot plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Shot plan deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete shot plan' },
      { status: 500 }
    );
  }
}
