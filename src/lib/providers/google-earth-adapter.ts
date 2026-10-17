import { SourceAdapter, SourceCapabilities, ProviderSearchParams, SearchResultItem } from './types';

export class GoogleEarthStudioAdapter implements SourceAdapter {
  public readonly id = 'google_earth';
  public readonly name = 'Google Earth Studio (Shot Route Planning)';
  public readonly description =
    'Provides pre-production camera route and aerial viewpoint planning links. Note: imagery is not licensed for commercial YouTube monetization.';

  public readonly capabilities: SourceCapabilities = {
    search: false,
    metadataRetrieval: false,
    previewDisplay: false,
    externalInspection: true,
    originalNavigation: true,
    directDownload: false,
    licenceMetadata: true,
    termsNotes:
      'Commercial Use Warning: Google Earth Studio terms state that Google does not offer a licence for commercial applications using Google Earth imagery. Monetized YouTube videos require separate written authorization or licensed footage alternatives.',
  };

  public static getStudioUrl(): string {
    return 'https://earth.google.com/studio/';
  }

  public static getFaqUrl(): string {
    return 'https://www.google.com/earth/studio/faq/';
  }

  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const lat = params.latitude ?? 54.0;
    const lon = params.longitude ?? -2.0;

    return [
      {
        id: `gearth_${lat.toFixed(4)}_${lon.toFixed(4)}`,
        providerId: 'google_earth',
        externalAssetId: `earth_${lat},${lon}`,
        title: `Aerial Route Planning: ${params.locationName}`,
        description:
          'Plan aerial approaches, reveals, and camera fly-through coordinates. Use this plan to inform licensed drone capture or stock acquisitions.',
        originalUrl: GoogleEarthStudioAdapter.getStudioUrl(),
        creator: 'Google Earth Studio',
        licenceName: 'Proprietary / Commercial Restrictions Apply',
        licenceUrl: GoogleEarthStudioAdapter.getFaqUrl(),
        attributionText: 'Pre-production camera trajectory planning link via Google Earth Studio.',
        commercialUseStatus: 'not_approved',
        adaptationRestrictions:
          'NOT APPROVED FOR COMMERCIAL MONETIZED YOUTUBE USE without explicit authorization. Do not represent render previews as final production assets.',
        latitude: lat,
        longitude: lon,
        distanceMeters: 0,
        mediaType: 'shot_plan',
        isDemoData: false,
      },
    ];
  }
}
