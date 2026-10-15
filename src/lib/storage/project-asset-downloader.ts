import fs from 'node:fs';
import path from 'node:path';
import { Project, ScriptScene, SceneCandidateResult } from '../types';
import { updateSceneDownloadStatus, addLocalMedia } from '../database/db';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'project';
}

export function generatePredictableFilename(
  sceneNumber: number,
  title: string,
  mediaType: string,
  suffix?: string
): string {
  const padded = String(sceneNumber).padStart(2, '0');
  const suff = suffix ? suffix.toUpperCase() : '';
  const cleanTitle = slugify(title).slice(0, 32);

  let ext = '.jpg';
  if (mediaType === 'video') {
    ext = '.mp4';
  } else if (mediaType === 'graphic' || title.toLowerCase().includes('graphic')) {
    ext = '.svg';
  } else if (title.toLowerCase().endsWith('.png')) {
    ext = '.png';
  }

  return `${padded}${suff}_${cleanTitle}${ext}`;
}

export class ProjectAssetDownloader {
  /**
   * Resolves the primary asset directory for a project
   */
  public static getProjectDirs(project: Project): {
    projectDir: string;
    assetsDir: string;
    metadataDir: string;
    publicWebDir: string;
  } {
    const slug = slugify(project.workingVideoTitle || project.title);
    const baseDir = path.join(process.cwd(), 'Britain-Off-Map-Projects', slug);
    const assetsDir = path.join(baseDir, 'assets');
    const metadataDir = path.join(baseDir, 'metadata');

    // Also mirror to public/projects/<slug>/assets for accessible web preview
    const publicWebDir = path.join(process.cwd(), 'public', 'projects', slug, 'assets');

    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }
    if (!fs.existsSync(publicWebDir)) {
      fs.mkdirSync(publicWebDir, { recursive: true });
    }

    return {
      projectDir: baseDir,
      assetsDir,
      metadataDir,
      publicWebDir,
    };
  }

  /**
   * Downloads or generates the approved asset for a script scene
   */
  public static async downloadSceneAsset(
    project: Project,
    scene: ScriptScene,
    candidate: SceneCandidateResult,
    suffix?: string
  ): Promise<{
    success: boolean;
    filename: string;
    localPath: string;
    webPath: string;
    fileSizeBytes: number;
    error?: string;
  }> {
    const { assetsDir, publicWebDir } = this.getProjectDirs(project);
    const filename = generatePredictableFilename(
      scene.sceneNumber,
      candidate.title,
      candidate.mediaType,
      suffix
    );

    const targetFilePath = path.join(assetsDir, filename);
    const publicFilePath = path.join(publicWebDir, filename);

    // Path traversal check
    const resolvedTarget = path.resolve(targetFilePath);
    if (!resolvedTarget.startsWith(path.resolve(assetsDir))) {
      throw new Error('Security violation: Attempted path traversal in filename.');
    }

    try {
      updateSceneDownloadStatus(scene.id, 'downloading');

      let fileBuffer: Buffer;

      // Handle custom graphic (Data URI SVG)
      if (candidate.downloadUrl?.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = candidate.downloadUrl.replace('data:image/svg+xml;base64,', '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (candidate.downloadUrl?.startsWith('http://') || candidate.downloadUrl?.startsWith('https://')) {
        // Fetch from remote provider URL
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for high-res video

        const res = await fetch(candidate.downloadUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'BritainOffMap-LocationCapture/1.0',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Download failed with status ${res.status}: ${res.statusText}`);
        }

        const arrayBuf = await res.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
      } else {
        // Provider does not permit direct download or requires manual action
        updateSceneDownloadStatus(
          scene.id,
          'manual_required',
          filename,
          undefined,
          'Direct automated download is restricted by provider. Please visit source link.'
        );

        return {
          success: false,
          filename,
          localPath: '',
          webPath: '',
          fileSizeBytes: 0,
          error: 'Provider requires manual download.',
        };
      }

      if (fileBuffer.length === 0) {
        throw new Error('Downloaded file is empty (0 bytes).');
      }

      // Write to project storage
      fs.writeFileSync(targetFilePath, fileBuffer);

      // Write to public folder for browser playback / display
      try {
        fs.writeFileSync(publicFilePath, fileBuffer);
      } catch {
        // Non-critical mirror failure
      }

      const slug = slugify(project.workingVideoTitle || project.title);
      const webPath = `/projects/${slug}/assets/${filename}`;
      const localRelPath = path.relative(process.cwd(), targetFilePath);

      // Update scene status in DB
      updateSceneDownloadStatus(scene.id, 'completed', filename, localRelPath);

      // Register in local_media table
      try {
        addLocalMedia({
          id: `media_scene_${scene.id}_${Date.now()}`,
          projectId: project.id,
          localRelativePath: webPath,
          originalFilename: filename,
          mediaType: candidate.mediaType,
          fileSizeBytes: fileBuffer.length,
          importedAt: new Date().toISOString(),
          licenceSnapshot: candidate.licenceName,
          attributionSnapshot: candidate.creator,
          notes: `Scene #${scene.sceneNumber} (${scene.timecode}) — ${scene.triggerPhrase || ''}`,
        });
      } catch {
        // Non-critical local_media duplicate ignore
      }

      return {
        success: true,
        filename,
        localPath: localRelPath,
        webPath,
        fileSizeBytes: fileBuffer.length,
      };
    } catch (err: any) {
      updateSceneDownloadStatus(scene.id, 'failed', filename, undefined, err.message);
      return {
        success: false,
        filename,
        localPath: '',
        webPath: '',
        fileSizeBytes: 0,
        error: err.message,
      };
    }
  }
}
