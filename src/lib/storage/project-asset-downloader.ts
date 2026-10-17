import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
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

      // Determine effective download URL candidates in quality order
      const urlsToAttempt: string[] = [];
      const primaryUrl = candidate.downloadUrl || candidate.previewUrl;

      if (primaryUrl) {
        // If Geograph URL, test high-res variants first
        if (primaryUrl.includes('geograph.org.uk')) {
          urlsToAttempt.push(primaryUrl.replace(/_120x120\.jpg$/i, '_1024x1024.jpg'));
          urlsToAttempt.push(primaryUrl.replace(/_120x120\.jpg$/i, '_800x800.jpg'));
          urlsToAttempt.push(primaryUrl.replace(/_120x120\.jpg$/i, '.jpg'));
        }
        urlsToAttempt.push(primaryUrl);
        if (candidate.previewUrl && candidate.previewUrl !== primaryUrl) {
          urlsToAttempt.push(candidate.previewUrl);
        }
      }

      // Handle custom graphic (Data URI SVG)
      if (primaryUrl?.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = primaryUrl.replace('data:image/svg+xml;base64,', '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (urlsToAttempt.length > 0 && (urlsToAttempt[0].startsWith('http://') || urlsToAttempt[0].startsWith('https://'))) {
        let downloadedOk = false;
        let lastError = '';

        const WIKIMEDIA_USER_AGENT =
          'LocationCapture-DocumentaryTool/1.0 (https://britainoffmap.example; contact@britainoffmap.example) NodeJS';

        for (const targetUrl of [...new Set(urlsToAttempt)]) {
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            attempts++;
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout for high-res

              const res = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                  'User-Agent': WIKIMEDIA_USER_AGENT,
                  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
                },
              });
              clearTimeout(timeout);

              if (res.ok) {
                const arrayBuf = await res.arrayBuffer();
                if (arrayBuf.byteLength > 2000) {
                  fileBuffer = Buffer.from(arrayBuf);
                  downloadedOk = true;
                  break;
                }
              } else if (res.status === 429) {
                lastError = `HTTP 429 Too Many Requests`;
                // Rate limited by Wikimedia / CDN, wait with backoff
                await new Promise((r) => setTimeout(r, 1200 * attempts));
                continue;
              } else {
                lastError = `HTTP ${res.status}: ${res.statusText}`;
                break;
              }
            } catch (fetchErr: any) {
              lastError = fetchErr.message;
              if (attempts < maxAttempts) {
                await new Promise((r) => setTimeout(r, 800));
              }
            }
          }
          if (downloadedOk) break;
        }

        if (!downloadedOk || !fileBuffer!) {
          throw new Error(`Görsel indirme başarısız oldu. Son hata: ${lastError}`);
        }
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

      // Resolution optimization: Ensure 1920x1080 Full HD (or preserve closest upper version)
      if (candidate.mediaType === 'photograph' || (!filename.endsWith('.mp4') && !filename.endsWith('.svg'))) {
        try {
          const meta = await sharp(fileBuffer).metadata();
          if (meta.width && meta.height) {
            const aspect = meta.width / meta.height;
            const isLandscape = aspect >= 1.15 && aspect <= 2.2;

            if (isLandscape) {
              // Standard documentary 16:9 1080p framing with smart entropy positioning
              fileBuffer = await sharp(fileBuffer)
                .resize(1920, 1080, {
                  fit: 'cover',
                  position: 'entropy',
                  kernel: sharp.kernel.lanczos3,
                })
                .jpeg({ quality: 95, mozjpeg: true })
                .toBuffer();
            } else {
              // Non-standard, portrait (vertical), or ultra-wide panorama:
              // Slicing 60% of a vertical photo ruins the subject!
              // Instead, create a broadcast-style 1920x1080 canvas:
              // 1) 1920x1080 background with heavy gaussian blur (25px) + subtle vignette
              // 2) The full uncropped photo sharp in the center (fit: contain)
              const bg = await sharp(fileBuffer)
                .resize(1920, 1080, { fit: 'cover' })
                .blur(25)
                .modulate({ brightness: 0.75 })
                .toBuffer();

              const fg = await sharp(fileBuffer)
                .resize(1920, 1080, {
                  fit: 'contain',
                  background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                .png()
                .toBuffer();

              fileBuffer = await sharp(bg)
                .composite([{ input: fg, gravity: 'center' }])
                .jpeg({ quality: 95, mozjpeg: true })
                .toBuffer();
            }
          }
        } catch (imgErr: any) {
          console.warn('Image post-processing notice:', imgErr.message);
        }
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
