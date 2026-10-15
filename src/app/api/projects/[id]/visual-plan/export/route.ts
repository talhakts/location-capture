import { NextResponse } from 'next/server';
import {
  getProject,
  listScriptScenesByProject,
  listSceneCandidatesByProject
} from '@/lib/database/db';
import { BatchExportManager } from '@/lib/exports/batch-export-manager';
import { ProjectAssetDownloader } from '@/lib/storage/project-asset-downloader';

export async function GET(
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

    const scenes = listScriptScenesByProject(projectId);
    const candidates = listSceneCandidatesByProject(projectId);
    const candidatesMap = new Map(candidates.map((c) => [c.id, c]));

    const writtenFiles = BatchExportManager.writeAllMetadataFiles(project, scenes, candidates);
    const { assetsDir, metadataDir } = ProjectAssetDownloader.getProjectDirs(project);

    const assetMapCsv = BatchExportManager.generateAssetMapCsv(scenes, candidatesMap);
    const shotListMd = BatchExportManager.generateShotList(project, scenes, candidatesMap);
    const attributionMd = BatchExportManager.generateAttributionReport(project, scenes, candidatesMap);
    const manifestJson = BatchExportManager.generateManifestJson(project, scenes, candidatesMap, candidates);

    return NextResponse.json({
      success: true,
      metadataDir,
      assetsDir,
      files: writtenFiles,
      content: {
        assetMapCsv,
        shotListMd,
        attributionMd,
        manifestJson,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Export generation failed' },
      { status: 500 }
    );
  }
}
