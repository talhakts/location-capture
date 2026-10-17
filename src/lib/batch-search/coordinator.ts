import {
  ScriptScene,
  SceneCandidateResult,
  CandidateMatchType,
  MediaType
} from '../types';
import { sourceRegistry } from '../providers/registry';
import { PexelsAdapter } from '../providers/pexels-adapter';
import { GeographAdapter } from '../providers/geograph-adapter';
import { GraphicGenerator } from '../graphics/graphic-generator';
import {
  saveSceneCandidates,
  updateScriptScene,
  selectSceneCandidate,
  listScriptScenesByProject,
  deduplicateSceneRecommendations,
  isAiScene,
  getDatabase
} from '../database/db';

export interface BatchSearchOptions {
  useDemoData?: boolean;
  generateCustomGraphics?: boolean;
  concurrency?: number;
  onSceneProgress?: (sceneId: string, status: string, count: number) => void;
}

const UK_TOWN_COORDINATES: Record<string, { lat: number; lon: number }> = {
  blackpool: { lat: 53.8175, lon: -3.0536 },
  morecambe: { lat: 54.0745, lon: -2.8641 },
  durham: { lat: 54.7761, lon: -1.5733 },
  easington: { lat: 54.7865, lon: -1.3421 },
  salcombe: { lat: 50.2384, lon: -3.7719 },
  padstow: { lat: 50.5401, lon: -4.9394 },
  sandbanks: { lat: 50.6865, lon: -1.9427 },
  grimsby: { lat: 53.5675, lon: -0.0805 },
  hull: { lat: 53.7457, lon: -0.3367 },
  scarborough: { lat: 54.2831, lon: -0.4044 },
  rhyl: { lat: 53.3204, lon: -3.4839 },
  margate: { lat: 51.3850, lon: 1.3838 },
  london: { lat: 51.5074, lon: -0.1278 },
  manchester: { lat: 53.4808, lon: -2.2426 },
  newcastle: { lat: 54.9783, lon: -1.6178 },
  birmingham: { lat: 52.4862, lon: -1.8904 },
  liverpool: { lat: 53.4084, lon: -2.9916 },
  leeds: { lat: 53.8008, lon: -1.5491 },
  sheffield: { lat: 53.3811, lon: -1.4701 },
  bristol: { lat: 51.4545, lon: -2.5879 },
  cornwall: { lat: 50.2660, lon: -5.0527 },
  devon: { lat: 50.7155, lon: -3.5309 },
  cumbria: { lat: 54.5772, lon: -2.7975 },
  yorkshire: { lat: 53.9590, lon: -1.0815 },
  sunderland: { lat: 54.9069, lon: -1.3838 },
  middlesbrough: { lat: 54.5742, lon: -1.2350 },
  hartlepool: { lat: 54.6862, lon: -1.2129 },
  hastings: { lat: 50.8552, lon: 0.5729 },
  eastbourne: { lat: 50.7680, lon: 0.2905 },
  skegness: { lat: 53.1432, lon: 0.3412 },
  greatyarmouth: { lat: 52.6083, lon: 1.7306 },
  torquay: { lat: 50.4619, lon: -3.5253 },
  weymouth: { lat: 50.6137, lon: -2.4576 }
};

function resolveTownCoordinates(locationName?: string, queryText?: string): { lat: number; lon: number } | undefined {
  const combined = `${locationName || ''} ${queryText || ''}`.toLowerCase();
  for (const [town, coords] of Object.entries(UK_TOWN_COORDINATES)) {
    if (combined.includes(town)) {
      return coords;
    }
  }
  return undefined;
}
/**
 * Determines whether a scene represents a UK geographical location (street, city, landscape, town)
 * vs an object, concept, interior, or generic stock visual.
 *
 * Kural: Sadece mekan/sokak/şehir sahneleri Geograph'tan,
 * geri kalan nesne ve diğer stok görselleri Pexels'ten aranır.
 */
export function isLocationScene(scene: ScriptScene): boolean {
  // 1. Explicit override if present in notes or content
  const explicitText = `${scene.unparsedContent || ''} ${scene.visualNotes || ''} ${scene.sceneType || ''}`.toLowerCase();
  if (explicitText.includes('geograph') || explicitText.includes('mekan') || explicitText.includes('sokak') || explicitText.includes('location')) {
    return true;
  }
  if (explicitText.includes('pexels') || explicitText.includes('nesne') || explicitText.includes('stok') || explicitText.includes('object')) {
    return false;
  }

  // 2. Named UK Location present
  if (scene.namedLocation && scene.namedLocation.trim().length > 0) {
    return true;
  }

  // 3. Scan all scene text for location / street / city / geography keywords
  const combinedText = [
    scene.voiceover || '',
    scene.visualNotes || '',
    scene.unparsedContent || '',
    ...(scene.searchQueries || []),
    scene.triggerPhrase || '',
  ].join(' ').toLowerCase();

  const locationIndicators = [
    'street', 'road', 'lane', 'avenue', 'terrace', 'crescent', 'alley', 'cul-de-sac', 'drive',
    'town', 'city', 'village', 'suburb', 'borough', 'county',
    'coast', 'coastal', 'beach', 'cliff', 'seafront', 'harbour', 'harbor', 'pier', 'promenade', 'bay',
    'colliery', 'mine', 'pit', 'station', 'school', 'church', 'park', 'bridge', 'pub', 'shopfront', 'high street',
    'exterior', 'facade', 'architecture', 'landscape', 'terraced house', 'brick house',
    'blackpool', 'durham', 'easington', 'london', 'morecambe', 'newcastle', 'sunderland', 'yorkshire', 'cumbria'
  ];

  for (const kw of locationIndicators) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(combinedText)) {
      return true;
    }
  }

  return false;
}

export class BatchSearchCoordinator {
  /**
   * Runs batch search across a set of scenes
   */
  public static async executeBatch(
    scenes: ScriptScene[],
    options: BatchSearchOptions = {}
  ): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    aiSkipped: number;
    totalCandidates: number;
  }> {
    const concurrency = options.concurrency || 2;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let aiSkipped = 0;
    let totalCandidates = 0;

    // Track assigned candidates to prevent duplicate suggestions across scenes
    const usedAssetKeys = new Set<string>();

    if (scenes.length > 0) {
      const allProjectScenes = listScriptScenesByProject(scenes[0].projectId);
      const searchingSceneIds = new Set(scenes.map((s) => s.id));
      for (const s of allProjectScenes) {
        if (!searchingSceneIds.has(s.id) && s.selectedAssetSnapshot) {
          const snapshot = s.selectedAssetSnapshot;
          if (snapshot.providerId && snapshot.externalAssetId) {
            usedAssetKeys.add(`${snapshot.providerId}_${snapshot.externalAssetId}`);
          }
        }
      }
    }

    // Process with concurrency pool
    const queue = [...scenes];
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const scene = queue.shift();
        if (!scene) break;

        // Skip AI scenes: AI prompt scenes are reserved for manual AI visual generation (Midjourney/Flux)
        if (isAiScene(scene)) {
          updateScriptScene(scene.id, {
            sceneType: 'ai_prompt',
            searchStatus: 'completed',
            selectedCandidateId: undefined,
            selectedAssetSnapshot: undefined,
          });

          try {
            const db = getDatabase();
            db.prepare('DELETE FROM scene_candidates WHERE sceneId = ?').run(scene.id);
          } catch {
            // Non-blocking
          }

          aiSkipped++;
          processed++;
          options.onSceneProgress?.(scene.id, 'completed', 0);
          continue;
        }

        try {
          updateScriptScene(scene.id, { searchStatus: 'searching' });
          options.onSceneProgress?.(scene.id, 'searching', 0);

          const candidates = await this.searchForScene(
            scene,
            options.useDemoData,
            options.generateCustomGraphics,
            usedAssetKeys
          );

          if (candidates.length > 0) {
            saveSceneCandidates(candidates);
            // Auto-select recommended candidate if none selected yet
            if (!scene.selectedCandidateId) {
              const recommended = candidates.find((c) => c.isRecommended) || candidates[0];
              selectSceneCandidate(scene.id, recommended);
            }

            updateScriptScene(scene.id, {
              searchStatus: 'completed',
            });
            succeeded++;
            totalCandidates += candidates.length;
            options.onSceneProgress?.(scene.id, 'completed', candidates.length);
          } else {
            updateScriptScene(scene.id, {
              searchStatus: 'needs_manual',
            });
            options.onSceneProgress?.(scene.id, 'needs_manual', 0);
          }
        } catch (err: any) {
          console.error(`Batch search error for scene #${scene.sceneNumber}:`, err.message);
          updateScriptScene(scene.id, {
            searchStatus: 'failed',
          });
          failed++;
          options.onSceneProgress?.(scene.id, 'failed', 0);
        } finally {
          processed++;
        }
      }
    });

    await Promise.all(workers);

    // Final deduplication pass to ensure 100% distinct selections across all scenes
    if (scenes.length > 0 && scenes[0].projectId) {
      try {
        deduplicateSceneRecommendations(scenes[0].projectId);
      } catch (dedupErr: any) {
        console.warn('Deduplication notice:', dedupErr.message);
      }
    }

    return {
      processed,
      succeeded,
      failed,
      aiSkipped,
      totalCandidates,
    };
  }

  /**
   * Search for a single scene across registered providers and custom graphics
   */
  public static async searchForScene(
    scene: ScriptScene,
    useDemoData: boolean = false,
    generateCustomGraphics: boolean = false,
    usedAssetKeys?: Set<string>
  ): Promise<SceneCandidateResult[]> {
    if (isAiScene(scene)) {
      return [];
    }

    const candidates: SceneCandidateResult[] = [];
    const seenExternalIds = new Set<string>();

    const queries = scene.searchQueries.length > 0
      ? scene.searchQueries
      : [scene.triggerPhrase || scene.voiceover || 'British terraced house'];

    const pexelsAdapter = sourceRegistry.get('pexels') as PexelsAdapter | undefined;
    const geographAdapter = sourceRegistry.get('geograph') as GeographAdapter | undefined;

    const maxCandidates = 10;
    const isLocation = isLocationScene(scene);

    if (isLocation) {
      // 1. SADECE MEKAN / SOKAK / ŞEHİR SAHNELERİ: Doğrudan Geograph
      if (geographAdapter) {
        for (const query of queries.slice(0, 2)) {
          const coords = resolveTownCoordinates(scene.namedLocation, query);
          try {
            const geographResults = await geographAdapter.search({
              queryText: query,
              locationName: scene.namedLocation || '',
              latitude: coords ? coords.lat : undefined,
              longitude: coords ? coords.lon : undefined,
              radiusKm: 15,
              perPage: maxCandidates,
              useDemoData,
            });

            for (let i = 0; i < geographResults.length; i++) {
              const item = geographResults[i];
              const key = `geograph_${item.externalAssetId}`;
              if (!seenExternalIds.has(key)) {
                seenExternalIds.add(key);
                candidates.push(this.mapSearchItemToCandidate(item, scene, query, candidates.length));
              }
              if (candidates.length >= maxCandidates) break;
            }
          } catch (err: any) {
            console.warn(`Geograph error for query "${query}":`, err.message);
          }

          if (candidates.length >= maxCandidates) {
            break;
          }
        }
      }
    } else {
      // 2. GERİ KALAN NESNE VEYA DİĞER STOK GÖRSELLERİ: Openverse (veya Pexels anahtarı varsa Pexels)
      const stockAdapter = (pexelsAdapter?.hasApiKey() ? pexelsAdapter : sourceRegistry.get('openverse')) || pexelsAdapter;
      if (stockAdapter) {
        for (const query of queries.slice(0, 2)) {
          try {
            const stockResults = await stockAdapter.search({
              queryText: query,
              locationName: '',
              perPage: maxCandidates,
              useDemoData,
            });

            for (let i = 0; i < stockResults.length; i++) {
              const item = stockResults[i];
              const key = `${item.providerId}_${item.externalAssetId}`;
              if (!seenExternalIds.has(key)) {
                seenExternalIds.add(key);
                candidates.push(this.mapSearchItemToCandidate(item, scene, query, candidates.length));
              }
              if (candidates.length >= maxCandidates) break;
            }
          } catch (err: any) {
            console.warn(`Stock search error for query "${query}":`, err.message);
          }

          if (candidates.length >= maxCandidates) {
            break;
          }
        }
      }
    }

    // Only if explicitly requested by user AND scene was marked as graphic, append as an alternative candidate
    if (generateCustomGraphics && scene.sceneType === 'custom_graphic') {
      const card = GraphicGenerator.createCandidate({
        title: scene.triggerPhrase || scene.voiceover || 'Property Data',
        subtitle: scene.visualNotes || 'Documentary Infographic',
        location: scene.namedLocation || 'United Kingdom',
        notes: scene.visualNotes,
        projectId: scene.projectId,
        sceneId: scene.id,
      });
      candidates.push(card);
    }

    // Rank and designate unique recommended result (strictly cap at 10 items)
    return this.rankCandidates(candidates, scene, usedAssetKeys).slice(0, 10);
  }

  private static mapSearchItemToCandidate(
    item: any,
    scene: ScriptScene,
    queryUsed: string,
    rankIndex: number = 0
  ): SceneCandidateResult {
    let matchType: CandidateMatchType = 'generic_visual';

    const fullDesc = `${item.title} ${item.description || ''}`.toLowerCase();
    const locMatch = scene.namedLocation?.toLowerCase();

    if (locMatch && fullDesc.includes(locMatch)) {
      matchType = 'exact_location';
    } else if (scene.namedLocation && item.distanceMeters && item.distanceMeters < 5000) {
      matchType = 'nearby_reference';
    } else if (scene.aiPrompt && (scene.visualNotes?.toLowerCase().includes('historic') || scene.visualNotes?.toLowerCase().includes('1970'))) {
      matchType = 'historic_reconstruction';
    }

    // Calculate score (earlier search results receive higher base priority)
    let score = 0.5 - (rankIndex * 0.01);
    if (matchType === 'exact_location') score += 0.4;
    if (matchType === 'nearby_reference') score += 0.25;

    // Media type preference bonus
    if (scene.targetMediaType === 'video' && item.mediaType === 'video') {
      score += 0.3;
    } else if (scene.targetMediaType === 'photo' && item.mediaType === 'photograph') {
      score += 0.15;
    }

    return {
      id: `cand_${scene.id}_${item.providerId}_${item.externalAssetId}`,
      sceneId: scene.id,
      projectId: scene.projectId,
      providerId: item.providerId,
      externalAssetId: item.externalAssetId,
      queryUsed,
      title: item.title,
      description: item.description,
      originalUrl: item.originalUrl,
      previewUrl: item.previewUrl,
      downloadUrl: item.downloadUrl || item.previewUrl,
      creator: item.creator,
      licenceName: item.licenceName,
      licenceUrl: item.licenceUrl,
      commercialUseStatus: item.commercialUseStatus,
      mediaType: item.mediaType as MediaType,
      width: item.width,
      height: item.height,
      relevanceScore: Math.min(1.0, score),
      matchType,
      isRecommended: false,
      geographicMatchNotes: item.distanceMeters
        ? `~${Math.round(item.distanceMeters / 1000)}km from target`
        : undefined,
      discoveredAt: new Date().toISOString(),
    };
  }

  private static rankCandidates(
    candidates: SceneCandidateResult[],
    scene: ScriptScene,
    usedAssetKeys?: Set<string>
  ): SceneCandidateResult[] {
    const getAssetKey = (c: SceneCandidateResult) => `${c.providerId}_${c.externalAssetId}`;

    const sorted = [...candidates].sort((a, b) => {
      // Prioritize candidates that have not been recommended or selected in previous scenes
      if (usedAssetKeys) {
        const aUsed = usedAssetKeys.has(getAssetKey(a)) ? 1 : 0;
        const bUsed = usedAssetKeys.has(getAssetKey(b)) ? 1 : 0;
        if (aUsed !== bUsed) return aUsed - bUsed; // Unused (0) comes first
      }

      // Prioritize media type match
      const aTypeMatch = (scene.targetMediaType === 'video' && a.mediaType === 'video') ? 1 : 0;
      const bTypeMatch = (scene.targetMediaType === 'video' && b.mediaType === 'video') ? 1 : 0;
      if (aTypeMatch !== bTypeMatch) return bTypeMatch - aTypeMatch;

      // Prioritize landscape aspect ratio suitable for 16:9 documentary production (1.2 to 2.1)
      if (a.width && a.height && b.width && b.height) {
        const aRatio = a.width / a.height;
        const bRatio = b.width / b.height;
        const aLandscape = (aRatio >= 1.2 && aRatio <= 2.1) ? 1 : 0;
        const bLandscape = (bRatio >= 1.2 && bRatio <= 2.1) ? 1 : 0;
        if (aLandscape !== bLandscape) return bLandscape - aLandscape;
      }

      // Prioritize high-resolution assets (>= 1200px) over lower resolution
      if (a.width && b.width) {
        const aHighRes = a.width >= 1200 ? 1 : 0;
        const bHighRes = b.width >= 1200 ? 1 : 0;
        if (aHighRes !== bHighRes) return bHighRes - aHighRes;
      }

      return b.relevanceScore - a.relevanceScore;
    });

    // Reset all isRecommended to false
    for (const c of sorted) {
      c.isRecommended = false;
    }

    // Designate the top candidate as recommended and register in usedAssetKeys
    if (sorted.length > 0) {
      const top = sorted[0];
      top.isRecommended = true;
      if (usedAssetKeys) {
        usedAssetKeys.add(getAssetKey(top));
      }
    }

    return sorted;
  }
}
