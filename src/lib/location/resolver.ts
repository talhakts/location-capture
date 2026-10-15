import { ResolvedLocationCandidate } from '../types';
import { analyzeLocationInput } from './postcode-normalizer';

interface PostcodesIoOutcodeResponse {
  status: number;
  result?: {
    outcode: string;
    longitude: number;
    latitude: number;
    northings?: number;
    eastings?: number;
    admin_district?: string[];
    parish?: string[];
    admin_county?: string[];
    country?: string[];
  };
}

interface PostcodesIoFullPostcodeResponse {
  status: number;
  result?: {
    postcode: string;
    longitude: number;
    latitude: number;
    admin_district?: string;
    admin_ward?: string;
    admin_county?: string | null;
    country?: string;
    region?: string;
    parish?: string | null;
  };
}

interface PostcodesIoPlaceItem {
  code: string;
  name_1: string;
  local_type?: string;
  outcode?: string;
  county_unitary?: string;
  district_borough?: string;
  region?: string;
  country?: string;
  longitude: number;
  latitude: number;
}

interface PostcodesIoPlacesResponse {
  status: number;
  result?: PostcodesIoPlaceItem[];
}

interface PhotonFeature {
  type: string;
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    countrycode?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}

export class LocationResolver {
  private static readonly USER_AGENT = 'BritainOffMap-LocationCapture/1.0 (production-research@britainoffmap.local)';

  /**
   * Resolves a UK user query (postcode, outcode, town, village, or street/address)
   * Returns a list of candidates for unambiguous resolution or user selection.
   */
  public static async resolve(rawQuery: string): Promise<ResolvedLocationCandidate[]> {
    const analysis = analyzeLocationInput(rawQuery);

    if (analysis.type === 'full_postcode') {
      const fullPostcodeResult = await this.resolveFullPostcode(analysis.normalized);
      if (fullPostcodeResult) return [fullPostcodeResult];
    }

    if (analysis.type === 'outcode') {
      const outcodeResult = await this.resolveOutcode(analysis.normalized);
      if (outcodeResult) return [outcodeResult];
    }

    // Check if query looks like a specific street or natural language address
    // e.g. "Grosvenor Street in Blackpool", "Baker Street, London", "Church Road"
    const lower = analysis.normalized.toLowerCase();
    const isStreetQuery =
      /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|walk|terrace|crescent|close|court|place|hill|promenade)\b/i.test(lower) ||
      lower.includes(' in ') ||
      lower.includes(' near ') ||
      (lower.includes(',') && !lower.includes('county'));

    // If it looks like a street or address, query Photon first (OpenStreetMap UK geocoder)
    if (isStreetQuery) {
      const photonResults = await this.resolvePhoton(analysis.normalized);
      if (photonResults.length > 0) {
        return photonResults;
      }
    }

    // Try place lookup via Postcodes.io (official Ordnance Survey places for settlements)
    const placeCandidates = await this.resolvePlaces(analysis.normalized);
    if (placeCandidates.length > 0) {
      return placeCandidates;
    }

    // If place lookup had no results, query Photon as general OSM fallback
    const generalPhoton = await this.resolvePhoton(analysis.normalized);
    if (generalPhoton.length > 0) {
      return generalPhoton;
    }

    // Nominatim fallback with compliant User-Agent and email
    const nominatimCandidates = await this.resolveNominatim(analysis.normalized);
    if (nominatimCandidates.length > 0) {
      return nominatimCandidates;
    }

    // Natural Language Fallback: If user entered "Street in Town" or "Street, Town",
    // extract the town name and resolve its center so the user can still proceed with research
    const splitMatch = analysis.normalized.match(/^(.*?)\s+(?:in|near|,)\s+(.*)$/i);
    if (splitMatch) {
      const streetPart = splitMatch[1].trim();
      const townPart = splitMatch[2].trim();
      const townCandidates = await this.resolvePlaces(townPart);
      if (townCandidates.length > 0) {
        return townCandidates.map((t) => ({
          ...t,
          resolvedName: `${streetPart} (${t.resolvedName} — Merkez Baz Alındı)`,
          resolutionPrecision: `${streetPart} Yaklaşık / ${t.resolvedName} Kasaba Merkezi`,
          confidenceScore: 0.75,
        }));
      }
    }

    return [];
  }

  private static async resolveFullPostcode(postcode: string): Promise<ResolvedLocationCandidate | null> {
    try {
      const encoded = encodeURIComponent(postcode.replace(/\s+/g, ''));
      const res = await fetch(`https://api.postcodes.io/postcodes/${encoded}`, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      if (!res.ok) return null;
      const data: PostcodesIoFullPostcodeResponse = await res.json();
      if (!data.result) return null;

      const r = data.result;
      const placeName = [r.postcode, r.admin_district, r.admin_county].filter(Boolean).join(', ');

      return {
        query: postcode,
        resolvedName: placeName,
        postcode: r.postcode,
        latitude: r.latitude,
        longitude: r.longitude,
        resolutionProvider: 'postcodes.io',
        resolutionPrecision: 'Exact Postcode Centroid',
        district: r.admin_district,
        county: r.admin_county || undefined,
        country: r.country,
        confidenceScore: 1.0,
      };
    } catch {
      return null;
    }
  }

  private static async resolveOutcode(outcode: string): Promise<ResolvedLocationCandidate | null> {
    try {
      const encoded = encodeURIComponent(outcode.trim());
      const res = await fetch(`https://api.postcodes.io/outcodes/${encoded}`, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      if (!res.ok) return null;
      const data: PostcodesIoOutcodeResponse = await res.json();
      if (!data.result) return null;

      const r = data.result;
      const district = Array.isArray(r.admin_district) ? r.admin_district.join(', ') : r.admin_district;
      const county = Array.isArray(r.admin_county) ? r.admin_county.join(', ') : r.admin_county;
      const nameParts = [`UK Outcode ${r.outcode}`, district, county].filter(Boolean);

      return {
        query: outcode,
        resolvedName: nameParts.join(' — '),
        postcode: r.outcode,
        latitude: r.latitude,
        longitude: r.longitude,
        resolutionProvider: 'postcodes.io',
        resolutionPrecision: 'Postal Outcode Area (~2-5km)',
        district,
        county,
        country: Array.isArray(r.country) ? r.country.join(', ') : r.country,
        confidenceScore: 0.95,
      };
    } catch {
      return null;
    }
  }

  private static async resolvePlaces(query: string): Promise<ResolvedLocationCandidate[]> {
    try {
      // If query has a comma like "Easington, County Durham", extract primary name for places search
      const parts = query.split(',').map((s) => s.trim());
      const primary = parts[0];
      const filterQualifier = parts.length > 1 ? parts[1].toLowerCase() : '';

      const encoded = encodeURIComponent(primary);
      const res = await fetch(`https://api.postcodes.io/places?q=${encoded}&limit=10`, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      if (!res.ok) return [];
      const data: PostcodesIoPlacesResponse = await res.json();
      if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
        return [];
      }

      let candidates = data.result.map((place) => {
        const titleParts = [
          place.name_1,
          place.local_type ? `(${place.local_type})` : null,
          place.outcode ? `[${place.outcode}]` : null,
          place.county_unitary || place.district_borough,
        ].filter(Boolean);

        return {
          query,
          resolvedName: titleParts.join(' '),
          postcode: place.outcode,
          latitude: place.latitude,
          longitude: place.longitude,
          resolutionProvider: 'postcodes.io (Ordnance Survey)',
          resolutionPrecision: `${place.local_type || 'Settlement'} Center`,
          district: place.district_borough,
          county: place.county_unitary,
          country: place.country,
          confidenceScore: 0.9,
        };
      });

      // If user typed "Easington, County Durham", sort/filter candidates matching "county durham"
      if (filterQualifier) {
        candidates = candidates.sort((a, b) => {
          const aMatch =
            (a.county && a.county.toLowerCase().includes(filterQualifier)) ||
            (a.district && a.district.toLowerCase().includes(filterQualifier));
          const bMatch =
            (b.county && b.county.toLowerCase().includes(filterQualifier)) ||
            (b.district && b.district.toLowerCase().includes(filterQualifier));
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }

      return candidates;
    } catch {
      return [];
    }
  }

  /**
   * Resolves streets, addresses, and landmarks via Photon (OpenStreetMap geocoding engine)
   * Highly effective for queries like "Grosvenor Street in Blackpool" or "Baker Street London".
   */
  private static async resolvePhoton(query: string): Promise<ResolvedLocationCandidate[]> {
    try {
      const encoded = encodeURIComponent(query.trim());
      const res = await fetch(`https://photon.komoot.io/api/?q=${encoded}&limit=8`, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      if (!res.ok) return [];
      const data: PhotonResponse = await res.json();
      if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
        return [];
      }

      // Filter strictly for United Kingdom (GB) results
      const gbFeatures = data.features.filter(
        (f) =>
          f.properties.countrycode === 'GB' ||
          f.properties.country === 'United Kingdom'
      );

      if (gbFeatures.length === 0) return [];

      return gbFeatures.map((f) => {
        const p = f.properties;
        const mainTitle = p.name || p.street || query;
        const locationDetails = [
          p.district,
          p.city || p.county,
          p.postcode,
        ].filter(Boolean);

        const fullName = locationDetails.length > 0
          ? `${mainTitle}, ${locationDetails.join(', ')}`
          : mainTitle;

        const [lon, lat] = f.geometry.coordinates;

        return {
          query,
          resolvedName: fullName,
          postcode: p.postcode,
          latitude: lat,
          longitude: lon,
          resolutionProvider: 'OpenStreetMap (Photon)',
          resolutionPrecision: p.type ? `Sokak / Konum (${p.type})` : 'Sokak / Cadde (Street Level)',
          district: p.district || p.city,
          county: p.county || p.state,
          country: p.country || 'Birleşik Krallık',
          confidenceScore: 0.95,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Fallback to official OpenStreetMap Nominatim with compliant User-Agent and contact email
   */
  private static async resolveNominatim(query: string): Promise<ResolvedLocationCandidate[]> {
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=gb&format=json&limit=5&email=research@britainoffmap.local`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
      });
      if (!res.ok) return [];
      const data: NominatimResult[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) return [];

      return data.map((item) => ({
        query,
        resolvedName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        resolutionProvider: 'OpenStreetMap Nominatim',
        resolutionPrecision: `Sokak / İşaret Noktası (${item.type})`,
        confidenceScore: 0.85,
      }));
    } catch {
      return [];
    }
  }
}

