import { MediaType, CommercialUseStatus } from '../types';

export interface SourceCapabilities {
  search: boolean;
  metadataRetrieval: boolean;
  previewDisplay: boolean;
  externalInspection: boolean;
  originalNavigation: boolean;
  directDownload: boolean; // MVP: false, manual download workflow
  licenceMetadata: boolean;
  rateLimitInfo?: string;
  termsNotes?: string;
}

export interface SearchResultItem {
  id: string;
  providerId: 'geograph' | 'pexels' | 'google_maps' | 'google_earth' | 'stock_video' | 'manual_upload' | 'custom_graphic';
  externalAssetId: string;
  title: string;
  description: string;
  originalUrl: string;
  previewUrl?: string;
  downloadUrl?: string;
  creator: string;
  licenceName: string;
  licenceUrl: string;
  attributionText: string;
  commercialUseStatus: CommercialUseStatus;
  adaptationRestrictions?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  mediaType: MediaType;
  isDemoData?: boolean;
}

export interface ProviderSearchParams {
  latitude: number;
  longitude: number;
  locationName: string;
  postcode?: string;
  radiusKm?: number;
  queryText?: string;
  perPage?: number;
  useDemoData?: boolean;
}

export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly capabilities: SourceCapabilities;
  search(params: ProviderSearchParams): Promise<SearchResultItem[]>;
}
