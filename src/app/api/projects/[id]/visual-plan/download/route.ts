import { NextResponse } from 'next/server';
import {
  getProject,
  listScriptScenesByProject,
  listSceneCandidatesByProject,
  getScriptScene
} from '@/lib/database/db';
import { ProjectAssetDownloader } from '@/lib/storage/project-asset-downloader';
import { BatchExportManager } from '@/lib/exports/batch-export-manager';

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
    const { sceneId } = body;

    const allScenes = listScriptScenesByProject(projectId);
    const allCandidates = listSceneCandidatesByProject(projectId);
    const candidateMap = new Map(allCandidates.map((c) => [c.id, c]));

    let targetScenes = allScenes.filter((s) => s.selectedCandidateId);
    if (sceneId) {
      targetScenes = targetScenes.filter((s) => s.id === sceneId);
    }

    if (targetScenes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No approved or selected scenes found to download' },
        { status: 400 }
      );
    }

    const results: Array<{
      sceneNumber: number;
      filename: string;
      success: boolean;
      webPath?: string;
      error?: string;
    }> = [];

    for (const scene of targetScenes) {
      const candidate = candidateMap.get(scene.selectedCandidateId!);
      if (!candidate) continue;

      const res = await ProjectAssetDownloader.downloadSceneAsset(project, scene, candidate);
      results.push({
        sceneNumber: scene.sceneNumber,
        filename: res.filename,
        success: res.success,
        webPath: res.webPath,
        error: res.error,
      });
    }

    // Refresh metadata files after downloads
    const updatedScenes = listScriptScenesByProject(projectId);
    try {
      BatchExportManager.writeAllMetadataFiles(project, updatedScenes, allCandidates);
    } catch (metaErr: any) {
      console.warn('Metadata write notice:', metaErr.message);
    }

    return NextResponse.json({
      success: true,
      downloadedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
      scenes: updatedScenes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Asset download failed' },
      { status: 500 }
    );
  }
}
