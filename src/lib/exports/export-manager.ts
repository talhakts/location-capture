import { Project, SourceReference, ShotPlan, LocalMedia } from '../types';

export class ExportManager {
  /**
   * Generates a complete project manifest as JSON
   */
  public static generateJsonManifest(
    project: Project,
    references: SourceReference[],
    shots: ShotPlan[],
    media: LocalMedia[]
  ): string {
    const data = {
      project,
      exportedAt: new Date().toISOString(),
      generator: 'Location Capture for Britain Off Map (v1.0.0)',
      stats: {
        totalReferences: references.length,
        totalShots: shots.length,
        totalEstimatedDurationSeconds: shots.reduce((sum, s) => sum + s.durationSeconds, 0),
        importedMediaFiles: media.length,
      },
      references,
      shotSequence: shots.sort((a, b) => a.sequenceOrder - b.sequenceOrder),
      localMedia: media,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Generates a CSV list of project references
   */
  public static generateReferencesCsv(references: SourceReference[]): string {
    const headers = [
      'ID',
      'Title',
      'Creator',
      'Provider',
      'Media Type',
      'Workflow Status',
      'Licence',
      'Commercial Status',
      'Distance (m)',
      'Latitude',
      'Longitude',
      'Original URL',
      'Attribution Text',
      'Notes',
    ];

    const escapeCsv = (str: string | number | undefined | null): string => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = references.map((r) =>
      [
        r.externalAssetId || r.id,
        r.title,
        r.creator,
        r.providerId,
        r.mediaType,
        r.workflowStatus,
        r.licenceName,
        r.commercialUseStatus,
        r.distanceMeters ?? '',
        r.latitude ?? '',
        r.longitude ?? '',
        r.originalUrl,
        r.attributionText,
        r.notes || '',
      ]
        .map(escapeCsv)
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generates the Attribution & Licence Report (attribution-report.md)
   * Suitable for video description credits or broadcast compliance records.
   */
  public static generateAttributionReport(project: Project, references: SourceReference[]): string {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let md = `# Attribution & Licence Compliance Report
**Project:** ${project.title}  
**Working Video Title:** ${project.workingVideoTitle || 'Untitled Video'}  
**Channel:** Britain Off Map  
**Generated:** ${dateStr}  

---

## Production Credit Summary (for YouTube Description)

\`\`\`text
=== VISUAL REFERENCES & PHOTOGRAPHY CREDITS ===
`;

    const geographRefs = references.filter((r) => r.providerId === 'geograph');
    const otherRefs = references.filter((r) => r.providerId !== 'geograph');

    if (geographRefs.length === 0 && otherRefs.length === 0) {
      md += `No visual references recorded for this project yet.\n`;
    } else {
      geographRefs.forEach((r, idx) => {
        md += `[${idx + 1}] "${r.title}" © ${r.creator} via Geograph Britain & Ireland\n`;
        md += `    Licence: CC BY-SA 2.0 (${r.licenceUrl || 'https://creativecommons.org/licenses/by-sa/2.0/'})\n`;
        md += `    Original: ${r.originalUrl}\n\n`;
      });

      otherRefs.forEach((r, idx) => {
        md += `[${geographRefs.length + idx + 1}] "${r.title}" — Source: ${r.providerId}\n`;
        md += `    Licence / Status: ${r.licenceName} (${r.commercialUseStatus})\n`;
        md += `    URL: ${r.originalUrl}\n\n`;
      });
    }

    md += `\`\`\`

---

## Licence Details & Adaptation Obligations

> [!IMPORTANT]
> **ShareAlike Clause (CC BY-SA 2.0):**
> If any photograph sourced from Geograph is cropped, modified, animated with digital camera moves (ken burns effect), or graded into the video, the derivative portion must also acknowledge CC BY-SA terms.

| Title | Creator | Licence | Commercial Status | Workflow Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    references.forEach((r) => {
      md += `| **${r.title.replace(/\|/g, '-')}** | ${r.creator} | ${r.licenceName} | \`${r.commercialUseStatus}\` | **${r.workflowStatus}** |\n`;
    });

    md += `\n*End of Attribution Report*\n`;
    return md;
  }

  /**
   * Generates the Ordered Shot List (shot-list.md)
   */
  public static generateShotList(project: Project, shots: ShotPlan[], references: SourceReference[]): string {
    const totalDuration = shots.reduce((acc, s) => acc + s.durationSeconds, 0);
    const refMap = new Map(references.map((r) => [r.id, r]));

    let md = `# Production Shot List: ${project.title}
**Working Video Title:** ${project.workingVideoTitle || 'Untitled Video'}  
**Total Planned Shots:** ${shots.length}  
**Total Estimated Runtime:** ${totalDuration} seconds (~${(totalDuration / 60).toFixed(1)} minutes)  

---

`;

    if (shots.length === 0) {
      md += `*No shots have been planned for this project yet.*\n`;
      return md;
    }

    const sorted = [...shots].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    sorted.forEach((shot, index) => {
      const linkedRef = shot.relatedReferenceId ? refMap.get(shot.relatedReferenceId) : undefined;

      md += `### Shot #${index + 1}: ${shot.shotType} (${shot.durationSeconds}s)
- **Visual Objective:** ${shot.visualObjective || 'Establishing location atmosphere'}
- **Camera Movement:** ${shot.movement}
`;

      if (shot.scriptExcerpt) {
        md += `- **Voiceover Script Context:** *"${shot.scriptExcerpt}"*\n`;
      }

      if (shot.startViewpoint || shot.endViewpoint) {
        md += `- **Viewpoint Trajectory:** From *${shot.startViewpoint || 'N/A'}* to *${shot.endViewpoint || 'N/A'}*\n`;
      }

      if (linkedRef) {
        md += `- **Linked Visual Reference:** [${linkedRef.title}](${linkedRef.originalUrl}) (Photographer: ${linkedRef.creator})\n`;
      }

      if (shot.productionNotes) {
        md += `- **Production / Edit Notes:** ${shot.productionNotes}\n`;
      }

      md += `\n---\n\n`;
    });

    return md;
  }
}
