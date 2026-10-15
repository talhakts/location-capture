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
  selectSceneCandidate
} from '../database/db';

export interface BatchSearchOptions {
  useDemoData?: boolean;
  concurrency?: number;
  onSceneProgress?: (sceneId: string, status: string, count: number) => void;
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
    totalCandidates: number;
  }> {
    const concurrency = options.concurrency || 2;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let totalCandidates = 0;

    // Process with concurrency pool
    const queue = [...scenes];
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const scene = queue.shift();
        if (!scene) break;

        try {
          updateScriptScene(scene.id, { searchStatus: 'searching' });
          options.onSceneProgress?.(scene.id, 'searching', 0);

          const candidates = await this.searchForScene(scene, options.useDemoData);

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

    return {
      processed,
      succeeded,
      failed,
      totalCandidates,
    };
  }

  /**
   * Search for a single scene across registered providers and custom graphics
   */
  public static async searchForScene(
    scene: ScriptScene,
    useDemoData: boolean = false
  ): Promise<SceneCandidateResult[]> {
    // 1. If scene is custom graphic, generate branded SVG card directly!
    if (scene.sceneType === 'custom_graphic') {
      const card = GraphicGenerator.createCandidate({
        title: scene.triggerPhrase || scene.voiceover || '£45,000',
        subtitle: scene.visualNotes || '2 Bed Terrace • Back Garden',
        location: scene.namedLocation || 'County Durham • Northern England',
        notes: scene.visualNotes,
        projectId: scene.projectId,
        sceneId: scene.id,
      });
      return [card];
    }

    const candidates: SceneCandidateResult[] = [];
    const seenExternalIds = new Set<string>();

    const queries = scene.searchQueries.length > 0
      ? scene.searchQueries
      : [scene.triggerPhrase || scene.voiceover || 'British terraced house'];

    const pexelsAdapter = sourceRegistry.get('pexels') as PexelsAdapter | undefined;
    const geographAdapter = sourceRegistry.get('geograph') as GeographAdapter | undefined;

    // Search query alternatives in order
    for (const query of queries.slice(0, 3)) {
      // Search Pexels
      if (pexelsAdapter) {
        try {
          const pexelsResults = await pexelsAdapter.search({
            queryText: query,
            locationName: scene.namedLocation || query,
            latitude: 54.0,
            longitude: -1.5,
            perPage: 6,
            useDemoData,
          });

          for (const item of pexelsResults) {
            const key = `pexels_${item.externalAssetId}`;
            if (!seenExternalIds.has(key)) {
              seenExternalIds.add(key);
              candidates.push(this.mapSearchItemToCandidate(item, scene, query));
            }
          }
        } catch (err: any) {
          console.warn(`Pexels error for query "${query}":`, err.message);
        }
      }

      // Search Geograph
      if (geographAdapter) {
        try {
          const geographResults = await geographAdapter.search({
            queryText: query,
            locationName: scene.namedLocation || 'Durham',
            latitude: 54.7761,
            longitude: -1.5733,
            radiusKm: 15,
            perPage: 6,
            useDemoData,
          });

          for (const item of geographResults) {
            const key = `geograph_${item.externalAssetId}`;
            if (!seenExternalIds.has(key)) {
              seenExternalIds.add(key);
              candidates.push(this.mapSearchItemToCandidate(item, scene, query));
            }
          }
        } catch (err: any) {
          console.warn(`Geograph error for query "${query}":`, err.message);
        }
      }

      // If we already collected sufficient candidates (>= 6), avoid excessive network hits
      if (candidates.length >= 8) {
        break;
      }
    }

    // Rank and designate recommended result
    return this.rankCandidates(candidates, scene);
  }

  private static mapSearchItemToCandidate(
    item: any,
    scene: ScriptScene,
    queryUsed: string
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

    // Calculate score
    let score = 0.5;
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
      downloadUrl: item.downloadUrl,
      creator: item.creator,
      licenceName: item.licenceName,
      licenceUrl: item.licenceUrl,
      commercialUseStatus: item.commercialUseStatus,
      mediaType: item.mediaType as MediaType,
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
    scene: ScriptScene
  ): SceneCandidateResult[] {
    const sorted = [...candidates].sort((a, b) => {
      // Prioritize media type match
      const aTypeMatch = (scene.targetMediaType === 'video' && a.mediaType === 'video') ? 1 : 0;
      const bTypeMatch = (scene.targetMediaType === 'video' && b.mediaType === 'video') ? 1 : 0;
      if (aTypeMatch !== bTypeMatch) return bTypeMatch - aTypeMatch;

      return b.relevanceScore - a.relevanceScore;
    });

    // Mark top candidate as recommended
    if (sorted.length > 0) {
      sorted[0].isRecommended = true;
    }

    return sorted;
  }
}
