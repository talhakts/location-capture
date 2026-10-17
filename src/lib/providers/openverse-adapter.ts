import {
  SourceAdapter,
  SourceCapabilities,
  SearchResultItem,
  ProviderSearchParams
} from './types';

export interface OpenverseImageItem {
  id: string;
  title: string;
  foreign_landing_url: string;
  url: string;
  creator: string;
  creator_url?: string;
  license: string;
  license_version?: string;
  license_url?: string;
  provider: string;
  source: string;
  thumbnail: string;
  width?: number;
  height?: number;
  attribution?: string;
  tags?: Array<{ name: string }>;
}

export class OpenverseAdapter implements SourceAdapter {
  public readonly id = 'openverse';
  public readonly name = 'Openverse Open Stock Library';
  public readonly description =
    'WordPress Foundation & Creative Commons search engine indexing 700+ million open-license stock photographs and objects with zero API key required.';

  public readonly capabilities: SourceCapabilities = {
    search: true,
    metadataRetrieval: true,
    previewDisplay: true,
    externalInspection: false,
    originalNavigation: true,
    directDownload: true,
    licenceMetadata: true,
    rateLimitInfo: 'Public open endpoint; reasonable request throttling applied.',
    termsNotes:
      'Openverse indexes Creative Commons and public domain works. Attribution required according to license terms.',
  };

  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const query = params.queryText?.trim() || params.locationName || 'British object';
    const perPage = Math.min(Math.max(params.perPage || 10, 1), 10);
    const items: SearchResultItem[] = [];

    // Attempt 1: Openverse public API (Free, no key)
    try {
      const openverseUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${perPage}`;
      const res = await fetch(openverseUrl, {
        headers: {
          'User-Agent': 'LocationCapture-MediaResearch/1.0 (contact@britainoffmap.example) NodeJS',
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          for (const item of data.results as OpenverseImageItem[]) {
            items.push(this.mapItemToResult(item, query));
            if (items.length >= perPage) break;
          }
        }
      } else {
        console.warn(`Openverse API returned status ${res.status} for query "${query}"`);
      }
    } catch (err: any) {
      console.warn(`Openverse fetch warning for query "${query}":`, err.message);
    }

    // Attempt 2: If Openverse returned fewer than perPage, fallback to Wikimedia Commons Open Stock
    if (items.length < perPage) {
      try {
        const commonsItems = await this.searchCommonsStock(query, perPage - items.length);
        for (const ci of commonsItems) {
          if (!items.some((existing) => existing.externalAssetId === ci.externalAssetId)) {
            items.push(ci);
          }
          if (items.length >= perPage) break;
        }
      } catch (err: any) {
        console.warn(`Commons stock fallback warning for query "${query}":`, err.message);
      }
    }

    return items;
  }

  private mapItemToResult(item: OpenverseImageItem, queryUsed: string): SearchResultItem {
    const cleanTitle = (item.title || `${queryUsed} stock reference`).trim();
    const cleanCreator = (item.creator || 'Openverse Contributor').trim();
    const licenceName = item.license
      ? `Creative Commons ${item.license.toUpperCase()} ${item.license_version || '2.0'}`.trim()
      : 'Creative Commons Attribution';

    return {
      id: `openverse_${item.id}`,
      providerId: 'openverse',
      externalAssetId: item.id,
      title: cleanTitle,
      description: `Stock photograph for "${queryUsed}". Source: ${item.source || item.provider || 'Openverse'}.`,
      originalUrl: item.foreign_landing_url || item.url,
      previewUrl: item.thumbnail || item.url,
      downloadUrl: item.url,
      creator: cleanCreator,
      licenceName,
      licenceUrl: item.license_url || 'https://creativecommons.org/licenses/',
      attributionText:
        item.attribution ||
        `Photo "${cleanTitle}" by ${cleanCreator}, licensed under ${licenceName}.`,
      commercialUseStatus: 'verified_commercial',
      mediaType: 'photograph',
      width: item.width,
      height: item.height,
      isDemoData: false,
    };
  }

  private async searchCommonsStock(query: string, limit: number): Promise<SearchResultItem[]> {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent(query) +
      `&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|extmetadata|thumburl&iiurlwidth=960&format=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LocationCapture-MediaResearch/1.0 (contact@britainoffmap.example) NodeJS',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pages = (Object.values(data.query?.pages || {}) as any[]).sort(
      (a, b) => (a.index || 0) - (b.index || 0)
    );

    const results: SearchResultItem[] = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info || !info.url) continue;

      const cleanUrl = info.url.split('?')[0];
      if (!cleanUrl.match(/\.(jpe?g|png|webp)$/i)) continue;

      let cleanTitle = p.title
        .replace(/^File:/i, '')
        .replace(/\.(jpe?g|png|webp)$/i, '')
        .replace(/[_-]/g, ' ')
        .trim();

      const rawArtist = info.extmetadata?.Artist?.value || 'Wikimedia Contributor';
      const cleanArtist = rawArtist.replace(/<[^>]+>/g, '').trim() || 'Wikimedia Contributor';
      const licenceName = info.extmetadata?.LicenseShortName?.value || 'CC BY-SA 2.0';

      results.push({
        id: `commons_stock_${p.pageid}`,
        providerId: 'openverse',
        externalAssetId: String(p.pageid),
        title: cleanTitle,
        description: `Open stock visual matching "${query}". Dimensions: ${info.width}x${info.height}.`,
        originalUrl: info.descriptionshorturl || info.url,
        previewUrl: info.thumburl || info.url,
        downloadUrl: info.url,
        creator: cleanArtist,
        licenceName,
        licenceUrl: 'https://creativecommons.org/licenses/',
        attributionText: `Photo "${cleanTitle}" by ${cleanArtist}, licensed under ${licenceName}.`,
        commercialUseStatus: 'verified_commercial',
        mediaType: 'photograph',
        width: info.width,
        height: info.height,
        isDemoData: false,
      });

      if (results.length >= limit) break;
    }

    return results;
  }
}
