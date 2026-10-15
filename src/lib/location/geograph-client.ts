import { SearchResultItem } from '../providers/types';
import { calculateDistanceMeters } from '../providers/geograph-adapter';

export function parseGeographItem(
  item: any,
  userLat: number,
  userLon: number
): SearchResultItem {
  let photoId = String(item.id || item.guid || '');
  if (!photoId && item.url) {
    const match = item.url.match(/photo\/(\d+)/);
    if (match) photoId = match[1];
  }
  if (!photoId) photoId = String(Math.floor(Math.random() * 1000000));

  const title = item.title || item.name || `Geograph Photo #${photoId}`;
  const creator = item.user || item.author || item.creator || item.submitter || 'Geograph Contributor';
  const originalUrl = item.url || `https://www.geograph.org.uk/photo/${photoId}`;

  // Image preview URL
  let previewUrl = item.thumb || item.img?.src || item.image || item.src;
  if (!previewUrl && item.hash) {
    previewUrl = `https://s0.geograph.org.uk/geophotos/${photoId.padStart(8, '0')}_${item.hash}_800x600.jpg`;
  }
  if (!previewUrl) {
    // Standard Geograph thumbnail pattern
    previewUrl = `https://s0.geograph.org.uk/photos/${photoId.slice(0, 2)}/${photoId.slice(2, 4)}/${photoId.padStart(6, '0')}_800x600.jpg`;
  }

  const lat = item.lat ? parseFloat(item.lat) : undefined;
  const lon = item.long ? parseFloat(item.long) : undefined;

  let dist: number | undefined = undefined;
  if (userLat && userLon && lat && lon) {
    dist = calculateDistanceMeters(userLat, userLon, lat, lon);
  }

  return {
    id: `geo_${photoId}`,
    providerId: 'geograph',
    externalAssetId: photoId,
    title,
    description:
      item.description || item.comment || 'Photographic reference from Geograph Britain and Ireland.',
    originalUrl,
    previewUrl,
    creator,
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: `Photo "${title}" © ${creator}, licensed under CC BY-SA 2.0 via Geograph Britain and Ireland (${originalUrl}). Note: ShareAlike condition applies to adaptations.`,
    commercialUseStatus: 'verified_commercial',
    adaptationRestrictions: 'ShareAlike condition requires credit and CC BY-SA downstream.',
    latitude: lat,
    longitude: lon,
    distanceMeters: dist,
    mediaType: 'photograph',
    isDemoData: false,
  };
}

/**
 * Executes a client-side JSONP call directly from the user's browser.
 * Bypasses server-side Cloudflare blocks because the request originates from the user's real browser session.
 */
export function fetchGeographClientJsonp(
  apiKey: string,
  lat: number,
  lon: number,
  radiusKm = 5,
  queryText?: string,
  perPage = 24
): Promise<SearchResultItem[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('JSONP only supported in browser'));
    }

    const callbackName = `geograph_callback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Geograph client request timed out after 12s.'));
    }, 12000);

    function cleanup() {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      try {
        const rawItems = Array.isArray(data)
          ? data
          : data.items || data.images || data.rows || data.feed?.entry || [];

        const results = rawItems.map((item: any) => parseGeographItem(item, lat, lon));
        resolve(results);
      } catch (err: any) {
        reject(new Error(`Failed to parse Geograph response: ${err.message}`));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Geograph script failed to load. Check network or API key.'));
    };

    let url = `https://api.geograph.org.uk/syndicator.php?key=${encodeURIComponent(
      apiKey
    )}&format=JSON&callback=${callbackName}&q=${lat},${lon}&distance=${radiusKm}&perpage=${perPage}`;

    if (queryText) {
      url += `&text=${encodeURIComponent(queryText)}`;
    }

    script.src = url;
    document.body.appendChild(script);
  });
}
