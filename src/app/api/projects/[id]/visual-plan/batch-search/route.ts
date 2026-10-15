import { NextResponse } from 'next/server';
import {
  getProject,
  listScriptScenesByProject,
  listSceneCandidatesByProject
} from '@/lib/database/db';
import { BatchSearchCoordinator } from '@/lib/batch-search/coordinator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const allScenes = listScriptScenesByProject(projectId);

    let targets = allScenes;
    if (body.sceneIds && Array.isArray(body.sceneIds) && body.sceneIds.length > 0) {
      const idSet = new Set(body.sceneIds);
      targets = allScenes.filter((s) => idSet.has(s.id));
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No scenes found to search' },
        { status: 400 }
      );
    }

    const result = await BatchSearchCoordinator.executeBatch(targets, {
      useDemoData: Boolean(body.useDemoData),
      concurrency: 3,
    });

    const updatedCandidates = listSceneCandidatesByProject(projectId);
    const updatedScenes = listScriptScenesByProject(projectId);

    return NextResponse.json({
      success: true,
      stats: result,
      scenes: updatedScenes,
      candidates: updatedCandidates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Batch search failed' },
      { status: 500 }
    );
  }
}
