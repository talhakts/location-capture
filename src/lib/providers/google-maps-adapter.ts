import { SourceAdapter, SourceCapabilities, ProviderSearchParams, SearchResultItem } from './types';

export class GoogleMapsAdapter implements SourceAdapter {
  public readonly id = 'google_maps';
  public readonly name = 'Google Maps / Street View (External Inspection)';
  public readonly description =
    'Provides external browser inspection links to examine streets, housing, terrain, and landmarks without extracting or scraping restricted map content.';

  public readonly capabilities: SourceCapabilities = {
    search: false, // External inspection only, does not return scrapable media
    metadataRetrieval: false,
    previewDisplay: false,
    externalInspection: true,
    originalNavigation: true,
    directDownload: false,
    licenceMetadata: false,
    termsNotes:
      'Compliance: Location inspection occurs strictly in the official browser environment. Imagery is not downloaded or scraped.',
  };

  public static getMapsUrl(lat: number, lon: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }

  public static getStreetViewUrl(lat: number, lon: number): string {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
  }

  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const lat = params.latitude ?? 54.0;
    const lon = params.longitude ?? -2.0;
    const mapsUrl = GoogleMapsAdapter.getMapsUrl(lat, lon);
    const streetViewUrl = GoogleMapsAdapter.getStreetViewUrl(lat, lon);

    return [
      {
        id: `gmaps_${lat.toFixed(4)}_${lon.toFixed(4)}`,
        providerId: 'google_maps',
        externalAssetId: `${lat},${lon}`,
        title: `Google Maps & Street View Context: ${params.locationName}`,
        description: `Inspect street-level architecture, building facades, and neighborhood topography for ${params.locationName} directly in your browser.`,
        originalUrl: mapsUrl,
        creator: 'Google LLC',
        licenceName: 'Proprietary Map Service (Inspection Only)',
        licenceUrl: 'https://www.google.com/help/terms_maps/',
        attributionText: 'Google Maps / Street View location link for external production inspection.',
        commercialUseStatus: 'restricted',
        adaptationRestrictions:
          'Terms strictly prohibit scraping, automated tile capture, or using unapproved screenshots in commercial broadcast media.',
        latitude: lat,
        longitude: lon,
        distanceMeters: 0,
        mediaType: 'map_reference',
        isDemoData: false,
      },
    ];
  }
}
