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

// ==========================================
// Script-to-Visuals Batch Studio Definitions
// ==========================================

export type SceneTargetMediaType = 'photo' | 'video' | 'graphic' | 'mixed';
export type SceneContentType = 'stock' | 'custom_graphic' | 'ai_prompt' | 'mixed';
export type SceneSearchStatus = 'pending' | 'searching' | 'completed' | 'failed' | 'needs_manual';
export type SceneDownloadStatus = 'none' | 'queued' | 'downloading' | 'completed' | 'failed' | 'manual_required';

export type CandidateMatchType =
  | 'exact_location'
  | 'nearby_reference'
  | 'generic_visual'
  | 'custom_graphic'
  | 'historic_reconstruction';

export interface VisualPlan {
  id: string;
  projectId: string;
  title?: string;
  rawInput: string;
  sceneCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptScene {
  id: string;
  projectId: string;
  visualPlanId: string;
  sceneNumber: number;
  timecode: string; // e.g. "0:00", "0:03"
  triggerPhrase?: string; // e.g. "Here's", "back garden"
  voiceover?: string;
  searchQueries: string[]; // Ordered alternative queries
  visualNotes?: string;
  aiPrompt?: string;
  motionPrompt?: string;
  targetMediaType: SceneTargetMediaType;
  targetDurationSeconds: number; // e.g. 6 or 8
  namedLocation?: string;
  sceneType: SceneContentType;
  unparsedContent?: string;
  searchStatus: SceneSearchStatus;
  selectedCandidateId?: string;
  selectedAssetSnapshot?: SceneCandidateResult;
  downloadStatus: SceneDownloadStatus;
  downloadedFilePath?: string;
  downloadedFilename?: string;
  downloadError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SceneCandidateResult {
  id: string;
  sceneId: string;
  projectId: string;
  providerId: 'geograph' | 'pexels' | 'custom_graphic' | 'stock_video';
  externalAssetId: string;
  queryUsed: string;
  title: string;
  description?: string;
  originalUrl: string;
  previewUrl: string;
  downloadUrl?: string;
  creator: string;
  licenceName: string;
  licenceUrl?: string;
  commercialUseStatus: CommercialUseStatus;
  mediaType: MediaType;
  width?: number;
  height?: number;
  durationSeconds?: number;
  relevanceScore: number;
  matchType: CandidateMatchType;
  isRecommended: boolean;
  geographicMatchNotes?: string;
  discoveredAt: string;
}

export interface BatchSearchProgress {
  totalScenes: number;
  completedScenes: number;
  searchingScenes: number;
  failedScenes: number;
  isFinished: boolean;
  activeSceneNumber?: number;
  errorMessage?: string;
}

export interface BatchAssetMapRow {
  sceneNumber: number;
  timecode: string;
  triggerPhrase: string;
  voiceover: string;
  localFilename: string;
  mediaType: string;
  provider: string;
  originalUrl: string;
  creator: string;
  licence: string;
  downloadStatus: string;
  geographicMatchStatus: string;
}

