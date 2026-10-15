import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getProject,
  updateProject,
  deleteProject,
  listReferencesByProject,
  listShotPlansByProject,
  listLocalMediaByProject,
} from '@/lib/database/db';

const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  workingVideoTitle: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  scriptExcerpt: z.string().max(5000).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = getProject(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const references = listReferencesByProject(id);
    const shotPlans = listShotPlansByProject(id);
    const localMedia = listLocalMediaByProject(id);

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        references,
        shotPlans,
        localMedia,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project' },
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
    const parsed = UpdateProjectSchema.parse(body);

    const updated = updateProject(id, parsed);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
