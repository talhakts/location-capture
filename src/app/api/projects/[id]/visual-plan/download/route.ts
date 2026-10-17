import { NextResponse } from 'next/server';
import {
  getProject,
  listScriptScenesByProject,
  listSceneCandidatesByProject,
  getScriptScene,
  selectSceneCandidate,
  deduplicateSceneRecommendations,
  isAiScene
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

    // Ensure distinct candidates are selected before download
    try {
      deduplicateSceneRecommendations(projectId);
    } catch {
      // Non-blocking
    }

    const allScenes = listScriptScenesByProject(projectId);
    const allCandidates = listSceneCandidatesByProject(projectId);
    const candidateMap = new Map(allCandidates.map((c) => [c.id, c]));

    let targetScenes = allScenes;
    if (sceneId) {
      const singleScene = allScenes.find((s) => s.id === sceneId);
      if (singleScene && isAiScene(singleScene)) {
        return NextResponse.json(
          {
            success: false,
            error: `Sahne #${singleScene.sceneNumber} bir AI canlandırma sahnesidir. Stok görsel aranmaz ve indirilmez; Midjourney / Flux promptu ile üretilmelidir.`
          },
          { status: 400 }
        );
      }
      targetScenes = targetScenes.filter((s) => s.id === sceneId);
    } else {
      // Exclude AI scenes: AI prompt scenes are reserved for manual AI visual generation and must not be downloaded as stock
      targetScenes = targetScenes.filter((s) => !isAiScene(s));

      // If no specific sceneId, filter for scenes that either have selectedCandidateId or have available candidates
      targetScenes = targetScenes.filter((s) => {
        if (s.selectedCandidateId) return true;
        return allCandidates.some((c) => c.sceneId === s.id);
      });
    }

    if (targetScenes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'İndirilecek onaylı stok görsel sahnesi bulunamadı (AI sahneleri otomatik olarak atlanır).' },
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
      let candidate = scene.selectedCandidateId ? candidateMap.get(scene.selectedCandidateId) : undefined;
      if (!candidate) {
        const candidatesForScene = allCandidates.filter((c) => c.sceneId === scene.id);
        candidate = candidatesForScene.find((c) => c.isRecommended) || candidatesForScene[0];
        if (candidate) {
          selectSceneCandidate(scene.id, candidate);
        }
      }
      if (!candidate) continue;

      const res = await ProjectAssetDownloader.downloadSceneAsset(project, scene, candidate);
      results.push({
        sceneNumber: scene.sceneNumber,
        filename: res.filename,
        success: res.success,
        webPath: res.webPath,
        error: res.error,
      });

      // Polite throttle between rapid automated downloads to respect CDN limits
      await new Promise((r) => setTimeout(r, 250));
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
