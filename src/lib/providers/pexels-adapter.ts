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
      if (params.useDemoData) {
        return this.getMockResults(query);
      }
      // Pexels API anahtarı olmadığında doğrudan ücretsiz ve açık Openverse stok arşivinden arar
      const { OpenverseAdapter } = await import('./openverse-adapter');
      const openverse = new OpenverseAdapter();
      return openverse.search(params);
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
    // Best download URL: original high-res (>= 1920x1080 or closest upper version), fallback to large2x
    const downloadUrl = photo.src.original || photo.src.large2x || photo.src.large;
    const previewUrl = photo.src.large2x || photo.src.large || photo.src.medium;

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
    // Pick 1920x1080, or closest higher version, or closest lower
    const mp4Files = video.video_files.filter(
      (f) => f.file_type === 'video/mp4' || !f.file_type || f.link.includes('.mp4')
    );

    // 1. Exact 1920x1080 (or width 1920)
    let bestFile = mp4Files.find(
      (f) => (f.width === 1920 && f.height === 1080) || f.width === 1920
    );

    // 2. Closest higher resolution (>= 1920, smallest width >= 1920 e.g. 2560x1440 or 3840x2160)
    if (!bestFile) {
      const higher = mp4Files
        .filter((f) => f.width && f.width >= 1920)
        .sort((a, b) => a.width - b.width);
      if (higher.length > 0) {
        bestFile = higher[0];
      }
    }

    // 3. If none >= 1920, closest lower resolution (highest available below 1920 e.g. 1280x720)
    if (!bestFile) {
      const lower = mp4Files
        .filter((f) => f.width && f.width < 1920)
        .sort((a, b) => b.width - a.width);
      if (lower.length > 0) {
        bestFile = lower[0];
      }
    }

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
    const mockLibrary = [
      {
        idSuffix: '101',
        title: 'Red-brick Victorian Terraces in Northern Town',
        preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'David Miller',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '102',
        title: 'British Seaside Promenade and Seafront Esplanade',
        preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'Oliver Ross',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '103',
        title: 'Traditional High Street Independent Shops and Post Office',
        preview: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'Emma Clarke',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '104',
        title: 'Suburban Street with Parked Hatchback Cars and Hedgerows',
        preview: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'James Thornton',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '105',
        title: 'Northern Coast Coastal Erosion and Defensive Sea Wall',
        preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'Liam Davies',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '106',
        title: 'Historic Cobbled Avenue and Old Streetlamp',
        preview: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
        download: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1920&h=1080&auto=format&fit=crop&q=90',
        creator: 'George Bennett',
        mediaType: 'photograph' as MediaType,
      },
      {
        idSuffix: '202',
        title: 'Street-level slow approach past brick houses (6s)',
        preview: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        download: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        creator: 'Sarah Jenkins',
        mediaType: 'video' as MediaType,
      },
    ];

    // Pick 2-3 different items based on query hash to guarantee variety
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = (hash << 5) - hash + query.charCodeAt(i);
      hash |= 0;
    }
    const offset = Math.abs(hash) % mockLibrary.length;
    const selected = [
      mockLibrary[offset],
      mockLibrary[(offset + 1) % mockLibrary.length],
      mockLibrary[(offset + 2) % mockLibrary.length],
    ];

    return selected.map((item, idx) => ({
      id: `mock_pexels_${item.idSuffix}_${Math.abs(hash + idx)}`,
      providerId: 'pexels' as any,
      externalAssetId: `mock_px_${item.idSuffix}_${Math.abs(hash + idx)}`,
      title: item.title,
      description: `Stock media matching "${query}". Full HD 1920x1080.`,
      originalUrl: `https://www.pexels.com/mock/${item.idSuffix}`,
      previewUrl: item.preview,
      downloadUrl: item.download,
      creator: item.creator,
      licenceName: 'Pexels License (Demo)',
      licenceUrl: 'https://www.pexels.com/license/',
      attributionText: `${item.mediaType === 'video' ? 'Video' : 'Photo'} by ${item.creator} from Pexels`,
      commercialUseStatus: 'verified_commercial',
      mediaType: item.mediaType,
      isDemoData: true,
    }));
  }
}
