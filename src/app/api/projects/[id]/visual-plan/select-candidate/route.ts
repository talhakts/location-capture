import { NextResponse } from 'next/server';
import {
  getScriptScene,
  selectSceneCandidate,
  listSceneCandidates,
  addSourceReference
} from '@/lib/database/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { sceneId, candidateId } = body;

    if (!sceneId) {
      return NextResponse.json(
        { success: false, error: 'sceneId is required' },
        { status: 400 }
      );
    }

    const scene = getScriptScene(sceneId);
    if (!scene) {
      return NextResponse.json(
        { success: false, error: 'Scene not found' },
        { status: 404 }
      );
    }

    if (!candidateId) {
      // Deselect
      selectSceneCandidate(sceneId, null);
      return NextResponse.json({
        success: true,
        scene: getScriptScene(sceneId),
      });
    }

    const candidates = listSceneCandidates(sceneId);
    const candidate = candidates.find((c) => c.id === candidateId);

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found for this scene' },
        { status: 404 }
      );
    }

    selectSceneCandidate(sceneId, candidate);

    // Also mirror to project source_references for full project workspace integration
    try {
      addSourceReference({
        id: `ref_scene_${candidate.id}`,
        projectId,
        providerId: candidate.providerId as any,
        externalAssetId: candidate.externalAssetId,
        title: candidate.title,
        description: candidate.description,
        originalUrl: candidate.originalUrl,
        previewUrl: candidate.previewUrl,
        creator: candidate.creator,
        licenceName: candidate.licenceName,
        licenceUrl: candidate.licenceUrl,
        attributionText: `${candidate.title} by ${candidate.creator}`,
        commercialUseStatus: candidate.commercialUseStatus,
        mediaType: candidate.mediaType,
        workflowStatus: 'Ready to use',
        notes: `Selected for Scene #${scene.sceneNumber} (${scene.timecode})`,
      });
    } catch {
      // Ignore if duplicate reference already exists
    }

    return NextResponse.json({
      success: true,
      scene: getScriptScene(sceneId),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to select candidate' },
      { status: 500 }
    );
  }
}
