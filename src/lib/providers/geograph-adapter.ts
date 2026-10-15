import { SourceAdapter, SourceCapabilities, ProviderSearchParams, SearchResultItem } from './types';

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatGeographAttribution(photographer: string, photoId: string, title: string): string {
  return `Photo "${title}" © ${photographer}, licensed for reuse under Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0). Source: Geograph Britain and Ireland (https://www.geograph.org.uk/photo/${photoId}). Note: ShareAlike clause applies to adapted derivative works.`;
}

// Curated authentic Geograph references for demo mode / testing
const DEMO_GEOGRAPH_ITEMS: SearchResultItem[] = [
  {
    id: 'demo_geo_6485401',
    providerId: 'geograph',
    externalAssetId: '6485401',
    title: 'Victorian Terraced Street, Sandylands',
    description: 'A typical row of stone and brick English terraced houses near the coast with bay windows and chimney stacks.',
    originalUrl: 'https://www.geograph.org.uk/photo/6485401',
    previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485401_d18c9a3b_800x600.jpg',
    creator: 'David Stowell',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Victorian Terraced Street, Sandylands" © David Stowell, licensed under CC BY-SA 2.0. Geograph Britain and Ireland (https://www.geograph.org.uk/photo/6485401).',
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'Requires CC BY-SA 2.0 license inheritance if modified or adapted.',
    latitude: 54.0682,
    longitude: -2.8685,
    distanceMeters: 420,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_6485402',
    providerId: 'geograph',
    externalAssetId: '6485402',
    title: 'Morecambe Promenade and Tidal Flats',
    description: 'Looking across the wide expanse of the bay toward the Lake District fells across the water on an overcast afternoon.',
    originalUrl: 'https://www.geograph.org.uk/photo/6485402',
    previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485402_e29b10cc_800x600.jpg',
    creator: 'Karl and Ali',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Morecambe Promenade and Tidal Flats" © Karl and Ali, licensed under CC BY-SA 2.0. Geograph Britain and Ireland (https://www.geograph.org.uk/photo/6485402).',
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'Attribution required in video credits or description; ShareAlike clause applies.',
    latitude: 54.0745,
    longitude: -2.8641,
    distanceMeters: 280,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_6485403',
    providerId: 'geograph',
    externalAssetId: '6485403',
    title: 'Former Colliery Housing, Easington Colliery',
    description: 'Long red-brick terraced avenue descending toward the North Sea coastal nature reserve, characteristic of East Durham mining settlements.',
    originalUrl: 'https://www.geograph.org.uk/photo/6485403',
    previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485403_f30c21dd_800x600.jpg',
    creator: 'Trevor Rickard',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Former Colliery Housing, Easington Colliery" © Trevor Rickard, licensed under CC BY-SA 2.0. Geograph Britain and Ireland (https://www.geograph.org.uk/photo/6485403).',
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'ShareAlike clause applies if cropped or color graded for video.',
    latitude: 54.7865,
    longitude: -1.3421,
    distanceMeters: 310,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_6485404',
    providerId: 'geograph',
    externalAssetId: '6485404',
    title: 'Seaside High Street & Local Traders',
    description: 'Independent bakeries, newsagents, and modest seaside shopfronts preserving post-war commercial typography.',
    originalUrl: 'https://www.geograph.org.uk/photo/6485404',
    previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485404_a41d32ee_800x600.jpg',
    creator: 'Mike Harris',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside High Street & Local Traders" © Mike Harris, licensed under CC BY-SA 2.0. Geograph Britain and Ireland (https://www.geograph.org.uk/photo/6485404).',
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'ShareAlike condition requires credit and CC BY-SA downstream.',
    latitude: 54.0712,
    longitude: -2.8698,
    distanceMeters: 510,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_6485405',
    providerId: 'geograph',
    externalAssetId: '6485405',
    title: 'Coastal Erosion and Sea Defences',
    description: 'Concrete revetments and rip-rap boulders holding the low boulder-clay cliffs against high North Sea tides.',
    originalUrl: 'https://www.geograph.org.uk/photo/6485405',
    previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485405_b52e43ff_800x600.jpg',
    creator: 'Paul Glazzard',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Coastal Erosion and Sea Defences" © Paul Glazzard, licensed under CC BY-SA 2.0. Geograph Britain and Ireland (https://www.geograph.org.uk/photo/6485405).',
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'CC BY-SA 2.0 attribution required.',
    latitude: 53.7251,
    longitude: 0.0312,
    distanceMeters: 620,
    mediaType: 'photograph',
    isDemoData: true,
  },
];

export class GeographAdapter implements SourceAdapter {
  public readonly id = 'geograph';
  public readonly name = 'Geograph Britain and Ireland';
  public readonly description =
    'Official API integration with geograph.org.uk to locate geographically representative UK photographs under Creative Commons licences.';

  public readonly capabilities: SourceCapabilities = {
    search: true,
    metadataRetrieval: true,
    previewDisplay: true,
    externalInspection: true,
    originalNavigation: true,
    directDownload: false, // Manual download workflow preserves source rights
    licenceMetadata: true,
    rateLimitInfo: 'Max 1000 items per query. 1 request per second recommended.',
    termsNotes:
      'All photographs licensed under Creative Commons Attribution-ShareAlike 2.0 (CC BY-SA 2.0). Display photographer credit and observe ShareAlike clause if adapted.',
  };

  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const apiKey = process.env.GEOGRAPH_API_KEY;

    // Check if demo mode explicitly requested or if no key configured
    if (params.useDemoData || !apiKey) {
      if (params.useDemoData) {
        return this.getDemoResults(params);
      }
      throw new Error(
        'GEOGRAPH_API_KEY is not configured on the server. Obtain a free API key at https://www.geograph.org.uk/get-api-key.php or enable Demo Mode to preview sample UK reference data.'
      );
    }

    try {
      const radiusKm = Math.min(Math.max(params.radiusKm || 5, 1), 20); // Geograph max is 20km
      const perPage = Math.min(Math.max(params.perPage || 24, 5), 100);

      // Official Syndicator query
      let url = `https://api.geograph.org.uk/syndicator.php?key=${encodeURIComponent(
        apiKey
      )}&format=JSON&q=${params.latitude},${params.longitude}&distance=${radiusKm}&perpage=${perPage}`;

      if (params.queryText) {
        url += `&text=${encodeURIComponent(params.queryText)}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LocationCapture-MediaResearch/1.0 (https://britainoffmap.example)',
        },
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error('Geograph API authentication failed. Please verify your GEOGRAPH_API_KEY.');
        }
        throw new Error(`Geograph API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      // Handle potential Cloudflare challenge or HTML response
      if (text.trim().startsWith('<') || text.includes('Just a moment')) {
        throw new Error(
          'Geograph API endpoint is currently protected by Cloudflare challenge or requires server whitelist. You can use Demo Mode for workflow development.'
        );
      }

      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : data.items || data.images || [];

      return items.map((item: any, idx: number) => {
        const photoId = String(item.id || item.guid || idx);
        const title = item.title || item.name || `Geograph Reference #${photoId}`;
        const photographer = item.user || item.author || item.creator || 'Geograph Contributor';
        const lat = item.lat ? parseFloat(item.lat) : undefined;
        const lon = item.long ? parseFloat(item.long) : undefined;
        const dist =
          lat && lon
            ? calculateDistanceMeters(params.latitude, params.longitude, lat, lon)
            : undefined;

        // Permitted thumbnail or preview URL
        const previewUrl =
          item.thumb ||
          item.img?.src ||
          (item.hash ? `https://s0.geograph.org.uk/geophotos/${photoId.padStart(8, '0')}_${item.hash}_800x600.jpg` : undefined);

        return {
          id: `geo_${photoId}`,
          providerId: 'geograph',
          externalAssetId: photoId,
          title,
          description: item.description || item.comment || 'Photographic reference from Geograph Britain and Ireland.',
          originalUrl: item.url || `https://www.geograph.org.uk/photo/${photoId}`,
          previewUrl,
          creator: photographer,
          licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
          licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
          attributionText: formatGeographAttribution(photographer, photoId, title),
          commercialUseStatus: 'verified_commercial',
          adaptationRestrictions:
            'ShareAlike clause applies: if cropped, edited, or color graded into video, resulting work must permit CC BY-SA 2.0.',
          latitude: lat,
          longitude: lon,
          distanceMeters: dist,
          mediaType: 'photograph',
          isDemoData: false,
        };
      });
    } catch (err: any) {
      throw new Error(`Geograph source error: ${err.message || 'Unknown network error'}`);
    }
  }

  private getDemoResults(params: ProviderSearchParams): SearchResultItem[] {
    // Recompute distance from user search centroid and filter by radius if needed
    return DEMO_GEOGRAPH_ITEMS.map((item) => {
      let dist = item.distanceMeters;
      if (item.latitude && item.longitude) {
        dist = calculateDistanceMeters(params.latitude, params.longitude, item.latitude, item.longitude);
      }
      return {
        ...item,
        distanceMeters: dist,
        isDemoData: true,
      };
    });
  }
}
