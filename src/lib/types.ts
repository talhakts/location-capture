export type WorkflowStatus =
  | 'Discovered'
  | 'Shortlisted'
  | 'Licence to review'
  | 'Ready to use'
  | 'Manually downloaded'
  | 'Imported locally'
  | 'Used in edit'
  | 'Rejected';

export type CommercialUseStatus =
  | 'verified_commercial'
  | 'restricted'
  | 'unverified'
  | 'permission_required'
  | 'not_approved';

export type MediaType = 'photograph' | 'video' | 'map_reference' | 'shot_plan';

export type ShotType =
  | 'Wide establishing shot'
  | 'Street-level establishing shot'
  | 'Slow forward approach'
  | 'Street or building reveal'
  | 'Row of terraced houses'
  | 'Shopfront or local landmark'
  | 'Coastal establishing shot'
  | 'Historic site overview'
  | 'Static documentary shot'
  | 'Detail shot';

export type CameraMovement =
  | 'Static framing'
  | 'Slow push-in'
  | 'Slow pull-back'
  | 'Gentle pan'
  | 'Left-to-right reveal'
  | 'Wide-to-close transition';

export interface Project {
  id: string;
  title: string;
  workingVideoTitle?: string;
  description?: string;
  scriptExcerpt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationRecord {
  id: string;
  query: string;
  resolvedName: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  resolutionProvider: string;
  resolutionPrecision: string; // 'outcode' | 'postcode' | 'point' | 'place' | 'approximate'
  county?: string;
  district?: string;
  country?: string;
  createdAt: string;
}

export interface SourceReference {
  id: string;
  projectId: string;
  locationId?: string;
  providerId: 'geograph' | 'google_maps' | 'google_earth' | 'manual_upload' | 'stock_video';
  externalAssetId: string;
  title: string;
  description?: string;
  originalUrl: string;
  previewUrl?: string;
  creator: string;
  licenceName: string;
  licenceUrl?: string;
  attributionText: string;
  commercialUseStatus: CommercialUseStatus;
  adaptationRestrictions?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  mediaType: MediaType;
  workflowStatus: WorkflowStatus;
  notes?: string;
  discoveredAt: string;
}

export interface ShotPlan {
  id: string;
  projectId: string;
  locationId?: string;
  relatedReferenceId?: string;
  sequenceOrder: number;
  durationSeconds: number; // 6 or 8
  shotType: ShotType;
  visualObjective: string;
  movement: CameraMovement;
  scriptExcerpt?: string;
  startViewpoint?: string;
  endViewpoint?: string;
  productionNotes?: string;
  preferredSource?: string;
  licenceStatus?: string;
}

export interface LocalMedia {
  id: string;
  projectId: string;
  sourceReferenceId?: string;
  localRelativePath: string;
  originalFilename: string;
  mediaType: string;
  fileSizeBytes: number;
  importedAt: string;
  licenceSnapshot?: string;
  attributionSnapshot?: string;
  notes?: string;
}

export interface ResolvedLocationCandidate {
  query: string;
  resolvedName: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  resolutionProvider: string;
  resolutionPrecision: string;
  county?: string;
  district?: string;
  country?: string;
  confidenceScore?: number;
}

export interface SearchFilterParams {
  latitude: number;
  longitude: number;
  locationName: string;
  postcode?: string;
  radiusKm: number;
  queryText?: string;
  targetDurationSeconds?: number;
  source?: 'geograph' | 'all';
  useDemoData?: boolean;
}
