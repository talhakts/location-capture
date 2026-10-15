import fs from 'node:fs';
import path from 'node:path';
import { Project, ScriptScene, SceneCandidateResult } from '../types';
import { ProjectAssetDownloader } from '../storage/project-asset-downloader';

export class BatchExportManager {
  /**
   * Generates the CSV mapping table (asset-map.csv)
   */
  public static generateAssetMapCsv(
    scenes: ScriptScene[],
    candidatesMap: Map<string, SceneCandidateResult>
  ): string {
    const headers = [
      'Scene Number',
      'Starting Timecode',
      'Trigger Phrase',
      'Voiceover Excerpt',
      'Local Filename',
      'Media Type',
      'Provider',
      'Original Source URL',
      'Creator',
      'Licence',
      'Download Status',
      'Geographic Match Status',
    ];

    const escapeCsv = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

    const rows = sorted.map((s) => {
      const selected = s.selectedCandidateId ? candidatesMap.get(s.selectedCandidateId) : undefined;
      return [
        s.sceneNumber,
        s.timecode,
        s.triggerPhrase || '',
        s.voiceover || '',
        s.downloadedFilename || '',
        selected?.mediaType || s.targetMediaType,
        selected?.providerId || 'None',
        selected?.originalUrl || '',
        selected?.creator || 'Unassigned',
        selected?.licenceName || 'N/A',
        s.downloadStatus,
        selected?.matchType || 'unresolved',
      ]
        .map(escapeCsv)
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generates the ordered production shot list (shot-list.md)
   */
  public static generateShotList(
    project: Project,
    scenes: ScriptScene[],
    candidatesMap: Map<string, SceneCandidateResult>
  ): string {
    const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
    const totalDuration = sorted.reduce((sum, s) => sum + s.targetDurationSeconds, 0);

    let md = `# Production Shot List & Edit Cue Sheet: ${project.title}
**Working Video Title:** ${project.workingVideoTitle || 'Untitled Video'}  
**Channel:** Britain Off Map  
**Total Scenes Planned:** ${sorted.length}  
**Total Estimated Runtime:** ${totalDuration} seconds (~${(totalDuration / 60).toFixed(1)} minutes)  
**Export Date:** ${new Date().toLocaleDateString('en-GB')}  

---

`;

    sorted.forEach((scene) => {
      const selected = scene.selectedCandidateId ? candidatesMap.get(scene.selectedCandidateId) : undefined;

      md += `### Scene #${String(scene.sceneNumber).padStart(2, '0')} | ${scene.timecode} (${scene.targetDurationSeconds}s)\n`;
      if (scene.triggerPhrase) {
        md += `- **Cue / Trigger:** \`"${scene.triggerPhrase}"\`\n`;
      }
      if (scene.voiceover) {
        md += `- **Voiceover:** *"${scene.voiceover}"*\n`;
      }
      if (scene.visualNotes) {
        md += `- **Visual Notes:** ${scene.visualNotes}\n`;
      }
      if (scene.motionPrompt) {
        md += `- **Camera Motion / Animation:** ${scene.motionPrompt}\n`;
      }
      if (scene.aiPrompt) {
        md += `- **AI Generation Prompt (Reconstruction):** \`${scene.aiPrompt}\`\n`;
      }

      if (selected) {
        md += `- **Selected Media Asset:** ${selected.title} (${selected.mediaType.toUpperCase()})\n`;
        md += `  - **Source Provider:** ${selected.providerId} • **Creator:** ${selected.creator}\n`;
        md += `  - **Licence:** ${selected.licenceName}\n`;
        md += `  - **Local Filename:** \`${scene.downloadedFilename || 'Pending download'}\`\n`;
        md += `  - **Source URL:** ${selected.originalUrl}\n`;
      } else {
        md += `- **Selected Asset:** ⚠️ *Needs selection or manual research*\n`;
      }

      md += `\n---\n\n`;
    });

    return md;
  }

  /**
   * Generates the attribution report (attribution-report.md)
   */
  public static generateAttributionReport(
    project: Project,
    scenes: ScriptScene[],
    candidatesMap: Map<string, SceneCandidateResult>
  ): string {
    const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

    let md = `# Attribution & Media Licensing Report
**Project:** ${project.title}  
**Working Video Title:** ${project.workingVideoTitle || 'Untitled Video'}  
**Channel:** Britain Off Map  
**Generated:** ${new Date().toLocaleDateString('en-GB')}  

---

## YouTube Description Credits Block

\`\`\`text
=== VISUAL REFERENCES & STOCK FOOTAGE CREDITS ===
`;

    let creditIndex = 1;
    sorted.forEach((scene) => {
      const selected = scene.selectedCandidateId ? candidatesMap.get(scene.selectedCandidateId) : undefined;
      if (!selected) return;

      if (selected.providerId === 'geograph') {
        md += `[${creditIndex++}] "${selected.title}" © ${selected.creator} via Geograph Britain & Ireland (CC BY-SA 2.0)\n`;
        md += `    URL: ${selected.originalUrl}\n`;
      } else if (selected.providerId === 'pexels') {
        md += `[${creditIndex++}] Video/Photo by ${selected.creator} via Pexels (${selected.licenceName})\n`;
        md += `    URL: ${selected.originalUrl}\n`;
      } else if (selected.providerId === 'custom_graphic') {
        md += `[${creditIndex++}] "${selected.title}" — Custom graphic created for Britain Off Map\n`;
      }
    });

    md += `\`\`\`

---

## Detailed Scene-by-Scene Rights Manifest

| Scene # | Timecode | Asset Title | Creator | Provider | Licence | Commercial Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
`;

    sorted.forEach((scene) => {
      const selected = scene.selectedCandidateId ? candidatesMap.get(scene.selectedCandidateId) : undefined;
      if (selected) {
        md += `| **#${String(scene.sceneNumber).padStart(2, '0')}** | \`${scene.timecode}\` | ${selected.title.replace(/\|/g, '-')} | ${selected.creator} | \`${selected.providerId}\` | ${selected.licenceName} | \`${selected.commercialUseStatus}\` |\n`;
      } else {
        md += `| **#${String(scene.sceneNumber).padStart(2, '0')}** | \`${scene.timecode}\` | *No asset selected* | — | — | — | *unresolved* |\n`;
      }
    });

    md += `\n*Report generated automatically by Location Capture Batch Studio.*\n`;
    return md;
  }

  /**
   * Generates the complete JSON manifest (manifest.json)
   */
  public static generateManifestJson(
    project: Project,
    scenes: ScriptScene[],
    candidatesMap: Map<string, SceneCandidateResult>,
    allCandidates: SceneCandidateResult[]
  ): string {
    const sorted = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

    const manifest = {
      manifestVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        workingVideoTitle: project.workingVideoTitle,
        description: project.description,
      },
      stats: {
        totalScenes: scenes.length,
        selectedScenes: scenes.filter((s) => s.selectedCandidateId).length,
        downloadedScenes: scenes.filter((s) => s.downloadStatus === 'completed').length,
        needsManualSearch: scenes.filter((s) => s.searchStatus === 'needs_manual').length,
      },
      scenes: sorted.map((s) => {
        const selected = s.selectedCandidateId ? candidatesMap.get(s.selectedCandidateId) : undefined;
        const sceneCandidates = allCandidates.filter((c) => c.sceneId === s.id);

        return {
          sceneNumber: s.sceneNumber,
          timecode: s.timecode,
          triggerPhrase: s.triggerPhrase,
          voiceover: s.voiceover,
          searchQueries: s.searchQueries,
          visualNotes: s.visualNotes,
          aiPrompt: s.aiPrompt,
          motionPrompt: s.motionPrompt,
          targetMediaType: s.targetMediaType,
          targetDurationSeconds: s.targetDurationSeconds,
          namedLocation: s.namedLocation,
          sceneType: s.sceneType,
          downloadStatus: s.downloadStatus,
          downloadedFilename: s.downloadedFilename,
          downloadedFilePath: s.downloadedFilePath,
          selectedAsset: selected || null,
          candidateAlternativesCount: sceneCandidates.length,
        };
      }),
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Writes all metadata files directly into the project's metadata directory
   */
  public static writeAllMetadataFiles(
    project: Project,
    scenes: ScriptScene[],
    allCandidates: SceneCandidateResult[]
  ): {
    csvPath: string;
    shotListPath: string;
    attributionPath: string;
    manifestPath: string;
  } {
    const { metadataDir } = ProjectAssetDownloader.getProjectDirs(project);
    const candidatesMap = new Map(allCandidates.map((c) => [c.id, c]));

    const csvContent = this.generateAssetMapCsv(scenes, candidatesMap);
    const shotListContent = this.generateShotList(project, scenes, candidatesMap);
    const attributionContent = this.generateAttributionReport(project, scenes, candidatesMap);
    const manifestContent = this.generateManifestJson(project, scenes, candidatesMap, allCandidates);

    const csvPath = path.join(metadataDir, 'asset-map.csv');
    const shotListPath = path.join(metadataDir, 'shot-list.md');
    const attributionPath = path.join(metadataDir, 'attribution-report.md');
    const manifestPath = path.join(metadataDir, 'manifest.json');

    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    fs.writeFileSync(shotListPath, shotListContent, 'utf-8');
    fs.writeFileSync(attributionPath, attributionContent, 'utf-8');
    fs.writeFileSync(manifestPath, manifestContent, 'utf-8');

    return {
      csvPath,
      shotListPath,
      attributionPath,
      manifestPath,
    };
  }
}
