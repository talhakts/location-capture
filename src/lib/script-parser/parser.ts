import { ScriptScene, SceneContentType, SceneTargetMediaType } from '../types';

export interface ParseResult {
  visualPlanTitle?: string;
  scenes: ScriptScene[];
  rawInput: string;
  warningCount: number;
}

/**
 * Parses timecode string (e.g. "0:00", "01:23", "0:03.5") to total seconds.
 */
export function timecodeToSeconds(tc: string): number {
  const parts = tc.trim().split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return parseFloat(tc) || 0;
}

/**
 * Extracts duration in seconds from motion text (e.g. "6 seconds", "8s", "5 sec").
 */
export function extractDurationFromText(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:seconds|second|secs|sec|s\b)/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0 && val < 300) {
      return Math.round(val);
    }
  }
  return null;
}

/**
 * Extracts alternative search queries from a string (split by →, ->, |, or newline).
 */
export function extractSearchQueries(rawStock: string): string[] {
  if (!rawStock) return [];
  const trimmedRaw = rawStock.trim();
  if (['none', 'n/a', 'yok', 'no', 'null', 'undefined', '-', ''].includes(trimmedRaw.toLowerCase())) {
    return [];
  }
  // Split on arrow markers or pipes or semicolons
  const parts = rawStock.split(/→|->|\||;/g);
  const queries: string[] = [];
  for (const p of parts) {
    const trimmed = p.trim().replace(/^["“”'«»]|["“”'«»]$/g, '');
    const pLower = trimmed.toLowerCase();
    if (
      trimmed.length > 1 &&
      !['none', 'n/a', 'yok', 'no', 'null', 'undefined', '-'].includes(pLower) &&
      !queries.includes(trimmed)
    ) {
      queries.push(trimmed);
    }
  }
  return queries;
}

/**
 * Detects common British locations from text
 */
export function extractNamedLocation(text: string): string | undefined {
  const commonLocations = [
    'County Durham',
    'Easington Colliery',
    'Easington',
    'Blackpool',
    'Morecambe Bay',
    'Morecambe',
    'Durham',
    'Newcastle',
    'Sunderland',
    'Hartlepool',
    'Middlesbrough',
    'Northumberland',
    'Cumbria',
    'Yorkshire',
    'Withernsea',
    'London',
  ];

  for (const loc of commonLocations) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(text)) {
      return loc;
    }
  }
  return undefined;
}

/**
 * Visual Plan Parser
 * Accepts the user's AI-generated visual plan text format and produces ordered ScriptScene objects.
 */
export class VisualPlanParser {
  /**
   * Parses raw text into ScriptScene items
   */
  public static parse(
    rawText: string,
    projectId: string,
    visualPlanId: string
  ): ParseResult {
    const lines = rawText.split(/\r?\n/);
    const sceneBlocks: string[][] = [];
    let currentBlock: string[] = [];

    // Header regex: e.g. "1 | 0:00 | trigger: \"Here's\"" or "1 | 0:00" or "Scene 2 | 0:03"
    const headerRegex = /^(?:scene\s*)?(\d+)\s*\|\s*(\d+:\d{2}(?::\d{2})?)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (headerRegex.test(trimmed)) {
        if (currentBlock.length > 0) {
          sceneBlocks.push(currentBlock);
        }
        currentBlock = [line];
      } else if (currentBlock.length > 0) {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      sceneBlocks.push(currentBlock);
    }

    const scenes: ScriptScene[] = [];
    const now = new Date().toISOString();
    let warningCount = 0;

    sceneBlocks.forEach((block, index) => {
      const firstLine = block[0].trim();
      const parts = firstLine.split('|').map((p) => p.trim());
      const numMatch = parts[0]?.match(/\d+/);
      const sceneNum = numMatch ? parseInt(numMatch[0], 10) : index + 1;
      const timecode = parts[1] || '0:00';
      let triggerPhrase: string | undefined;

      for (let p = 2; p < parts.length; p++) {
        const seg = parts[p];
        if (/^trigger:\s*/i.test(seg)) {
          triggerPhrase = seg
            .replace(/^trigger:\s*/i, '')
            .replace(/^["“']|["”']$/g, '')
            .trim();
        }
      }

      let voiceover: string | undefined;
      const queries: string[] = [];
      let visualNotes: string | undefined;
      let aiPrompt: string | undefined;
      let motionPrompt: string | undefined;
      const unparsedLines: string[] = [];

      for (let i = 1; i < block.length; i++) {
        const line = block[i].trim();
        if (!line) continue;

        if (/^voiceover:\s*/i.test(line)) {
          voiceover = line.replace(/^voiceover:\s*/i, '').replace(/^["“']|["”']$/g, '').trim();
        } else if (/^stock:\s*/i.test(line)) {
          const rawStock = line.replace(/^stock:\s*/i, '').trim();
          queries.push(...extractSearchQueries(rawStock));
        } else if (/^notes:\s*/i.test(line)) {
          visualNotes = line.replace(/^notes:\s*/i, '').trim();
        } else if (/^(?:ai prompt|image prompt|prompt):\s*/i.test(line)) {
          const rawPrompt = line.replace(/^(?:ai prompt|image prompt|prompt):\s*/i, '').trim();
          if (rawPrompt && !['none', 'n/a', 'yok', 'no', 'null', 'undefined', '-'].includes(rawPrompt.toLowerCase())) {
            aiPrompt = rawPrompt;
          } else {
            aiPrompt = undefined;
          }
        } else if (/^motion:\s*/i.test(line)) {
          motionPrompt = line.replace(/^motion:\s*/i, '').trim();
        } else {
          // Check if line contains inline queries (e.g. without "Stock:" prefix)
          if (line.includes('→') || line.includes('->')) {
            queries.push(...extractSearchQueries(line));
          } else {
            unparsedLines.push(line);
          }
        }
      }

      // Duration: try motion text first, or default to 8 seconds
      let targetDuration = 8;
      if (motionPrompt) {
        const dur = extractDurationFromText(motionPrompt);
        if (dur) targetDuration = dur;
      }

      // Media type and scene type detection
      const fullContext = [firstLine, voiceover, queries.join(' '), visualNotes, aiPrompt, motionPrompt].join(' ');
      const namedLocation = extractNamedLocation(fullContext);

      let sceneType: SceneContentType = 'stock';
      let targetMediaType: SceneTargetMediaType = 'photo';

      // Only mark as graphic if explicitly specified with "custom graphic" or "graphic card" (never from price/currency mentions in voiceover)
      const isExplicitGraphic =
        /\b(?:type:\s*graphic|custom graphic|graphic card)\b/i.test(fullContext);

      if (isExplicitGraphic) {
        sceneType = 'custom_graphic';
        targetMediaType = 'graphic';
      } else if (aiPrompt) {
        // Dedicated AI scene: should be generated via AI, skipped from stock search & download
        sceneType = 'ai_prompt';
      } else {
        sceneType = 'stock';
      }

      // Check if video is preferred
      const isVideoPreferred =
        /\b(?:video|clip|footage|mp4|drone|drive-by|b-roll|panning video)\b/i.test(queries.join(' ') + ' ' + (visualNotes || '')) ||
        (motionPrompt && /handheld|pan|push-in|motion/i.test(motionPrompt));

      if (isVideoPreferred && !isExplicitGraphic) {
        targetMediaType = 'video';
      }

      if (unparsedLines.length > 0) {
        warningCount++;
      }

      const sceneId = `scene_${visualPlanId}_${sceneNum}_${Math.random().toString(36).slice(2, 6)}`;

      scenes.push({
        id: sceneId,
        projectId,
        visualPlanId,
        sceneNumber: sceneNum,
        timecode,
        triggerPhrase,
        voiceover,
        searchQueries: queries,
        visualNotes,
        aiPrompt,
        motionPrompt,
        targetMediaType,
        targetDurationSeconds: targetDuration,
        namedLocation,
        sceneType,
        unparsedContent: unparsedLines.length > 0 ? unparsedLines.join('\n') : undefined,
        searchStatus: 'pending',
        downloadStatus: 'none',
        createdAt: now,
        updatedAt: now,
      });
    });

    return {
      scenes: scenes.sort((a, b) => a.sceneNumber - b.sceneNumber),
      rawInput: rawText,
      warningCount,
    };
  }

  /**
   * JSON Import / Export support
   */
  public static fromJson(jsonStr: string, projectId: string, visualPlanId: string): ScriptScene[] {
    const parsed = JSON.parse(jsonStr);
    const items = Array.isArray(parsed) ? parsed : parsed.scenes || [];
    const now = new Date().toISOString();

    return items.map((item: any, idx: number) => ({
      id: item.id || `scene_${visualPlanId}_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      visualPlanId,
      sceneNumber: item.sceneNumber || idx + 1,
      timecode: item.timecode || '0:00',
      triggerPhrase: item.triggerPhrase,
      voiceover: item.voiceover,
      searchQueries: Array.isArray(item.searchQueries) ? item.searchQueries : extractSearchQueries(item.searchQueries || ''),
      visualNotes: item.visualNotes,
      aiPrompt: item.aiPrompt,
      motionPrompt: item.motionPrompt,
      targetMediaType: item.targetMediaType || 'photo',
      targetDurationSeconds: item.targetDurationSeconds || 8,
      namedLocation: item.namedLocation,
      sceneType: item.sceneType || 'stock',
      unparsedContent: item.unparsedContent,
      searchStatus: item.searchStatus || 'pending',
      downloadStatus: item.downloadStatus || 'none',
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }));
  }

  public static toJson(scenes: ScriptScene[]): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scenes,
      },
      null,
      2
    );
  }
}
