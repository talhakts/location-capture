import {
  SourceAdapter,
  SourceCapabilities,
  SearchResultItem,
  ProviderSearchParams
} from './types';
import { MediaType } from '../types';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps?: number;
  link: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
}

export interface PexelsPhotoSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

export interface PexelsVideoSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  videos: PexelsVideo[];
}

export class PexelsAdapter implements SourceAdapter {
  public readonly id = 'pexels';
  public readonly name = 'Pexels Official Stock Library';
  public readonly description =
    'Official Pexels API for curated documentary, street-level, and atmospheric royalty-free photographs and HD/4K videos.';

  public readonly capabilities: SourceCapabilities = {
    search: true,
    metadataRetrieval: true,
    previewDisplay: true,
    externalInspection: false,
    originalNavigation: true,
    directDownload: true, // Official API permits downloading media via returned URLs
    licenceMetadata: true,
    rateLimitInfo: '200 requests/hour, 20,000 requests/month',
    termsNotes:
      'Pexels License: Free for commercial and non-commercial use. Giving credit to creator is appreciated. No redistribution of unaltered copies as stock.',
  };

  private getApiKey(): string | undefined {
    return process.env.PEXELS_API_KEY;
  }

  public hasApiKey(): boolean {
    return Boolean(this.getApiKey() && this.getApiKey()?.trim().length! > 5);
  }

  /**
   * Search Pexels photos and videos for a given query text.
   */
  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const query = params.queryText?.trim() || params.locationName || 'British landscape';
    const apiKey = this.getApiKey();

    if (!apiKey) {
      // In test mode or when unconfigured, return demo candidates if requested, otherwise empty
      if (params.useDemoData) {
        return this.getMockResults(query);
      }
      return [];
    }

    const perPage = params.perPage || 10;
    const items: SearchResultItem[] = [];

    // Search Photos
    try {
      const photoUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
      const res = await fetch(photoUrl, {
        headers: {
          Authorization: apiKey,
          'User-Agent': 'BritainOffMap-LocationCapture/1.0',
        },
      });

      if (res.ok) {
        const data: PexelsPhotoSearchResponse = await res.json();
        if (data.photos && Array.isArray(data.photos)) {
          for (const p of data.photos) {
            items.push(this.mapPhotoToResult(p, query));
          }
        }
      } else {
        console.warn(`Pexels photo search error: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('Pexels photo fetch error:', err.message);
    }

    // Search Videos
    try {
      const videoUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${Math.min(perPage, 8)}&orientation=landscape`;
      const res = await fetch(videoUrl, {
        headers: {
          Authorization: apiKey,
          'User-Agent': 'BritainOffMap-LocationCapture/1.0',
        },
      });

      if (res.ok) {
        const data: PexelsVideoSearchResponse = await res.json();
        if (data.videos && Array.isArray(data.videos)) {
          for (const v of data.videos) {
            items.push(this.mapVideoToResult(v, query));
          }
        }
      }
    } catch (err: any) {
      console.warn('Pexels video fetch error:', err.message);
    }

    return items;
  }

  public mapPhotoToResult(photo: PexelsPhoto, queryUsed: string): SearchResultItem {
    // Best download URL: original or large2x
    const downloadUrl = photo.src.original || photo.src.large2x || photo.src.large;
    const previewUrl = photo.src.large || photo.src.medium;

    return {
      id: `pexels_photo_${photo.id}`,
      providerId: 'pexels' as any,
      externalAssetId: String(photo.id),
      title: photo.alt || `Pexels photograph by ${photo.photographer}`,
      description: `Stock photograph matching "${queryUsed}". Dimensions: ${photo.width}x${photo.height}.`,
      originalUrl: photo.url,
      previewUrl,
      downloadUrl,
      creator: photo.photographer,
      licenceName: 'Pexels License (Commercial & Non-Commercial)',
      licenceUrl: 'https://www.pexels.com/license/',
      attributionText: `Photo by ${photo.photographer} from Pexels`,
      commercialUseStatus: 'verified_commercial',
      adaptationRestrictions: 'Modification permitted. Do not resell unaltered copies.',
      mediaType: 'photograph' as MediaType,
      isDemoData: false,
    };
  }

  public mapVideoToResult(video: PexelsVideo, queryUsed: string): SearchResultItem {
    // Pick the best MP4 video file (prefer 1920x1080 or HD)
    let bestFile = video.video_files.find(
      (f) => f.quality === 'hd' && f.file_type === 'video/mp4' && f.width >= 1280
    );
    if (!bestFile && video.video_files.length > 0) {
      bestFile = video.video_files[0];
    }

    const downloadUrl = bestFile ? bestFile.link : video.url;
    const previewUrl = video.image;

    return {
      id: `pexels_video_${video.id}`,
      providerId: 'pexels' as any,
      externalAssetId: String(video.id),
      title: `Pexels Video Clip by ${video.user?.name || 'Creator'} (${video.duration}s)`,
      description: `Stock footage matching "${queryUsed}". Duration: ${video.duration}s. Dimensions: ${video.width}x${video.height}.`,
      originalUrl: video.url,
      previewUrl,
      downloadUrl,
      creator: video.user?.name || 'Pexels Creator',
      licenceName: 'Pexels License (Commercial & Non-Commercial)',
      licenceUrl: 'https://www.pexels.com/license/',
      attributionText: `Video by ${video.user?.name || 'Creator'} from Pexels`,
      commercialUseStatus: 'verified_commercial',
      adaptationRestrictions: 'Modification and video editing permitted.',
      mediaType: 'video' as MediaType,
      isDemoData: false,
    };
  }

  public getMockResults(query: string): SearchResultItem[] {
    return [
      {
        id: `mock_pexels_photo_${Math.abs(query.length * 101)}`,
        providerId: 'pexels' as any,
        externalAssetId: 'mock_px_101',
        title: `Red-brick Victorian Terraces in Northern Town`,
        description: `Atmospheric overcast documentary style photo matching "${query}".`,
        originalUrl: 'https://www.pexels.com/photo/victorian-terraced-houses-101/',
        previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
        downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&auto=format&fit=crop&q=80',
        creator: 'David Miller',
        licenceName: 'Pexels License (Demo)',
        licenceUrl: 'https://www.pexels.com/license/',
        attributionText: 'Photo by David Miller from Pexels',
        commercialUseStatus: 'verified_commercial',
        mediaType: 'photograph' as MediaType,
        isDemoData: true,
      },
      {
        id: `mock_pexels_video_${Math.abs(query.length * 202)}`,
        providerId: 'pexels' as any,
        externalAssetId: 'mock_px_202',
        title: `Street-level slow approach past brick houses (6s)`,
        description: `Cinematic 4K slow push-in matching "${query}".`,
        originalUrl: 'https://www.pexels.com/video/slow-street-panning-202/',
        previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        creator: 'Sarah Jenkins',
        licenceName: 'Pexels License (Demo)',
        licenceUrl: 'https://www.pexels.com/license/',
        attributionText: 'Video by Sarah Jenkins from Pexels',
        commercialUseStatus: 'verified_commercial',
        mediaType: 'video' as MediaType,
        isDemoData: true,
      },
    ];
  }
}
