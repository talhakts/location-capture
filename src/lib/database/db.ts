import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  Project,
  LocationRecord,
  SourceReference,
  ShotPlan,
  LocalMedia,
  WorkflowStatus,
  VisualPlan,
  ScriptScene,
  SceneCandidateResult,
  SceneDownloadStatus
} from '../types';

let dbInstance: DatabaseSync | null = null;

export function getDbPath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'location_capture.db');
}

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();
  const db = new DatabaseSync(dbPath);

  // Enable WAL, Busy Timeout, and Foreign Keys
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      workingVideoTitle TEXT,
      description TEXT,
      scriptExcerpt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      resolvedName TEXT NOT NULL,
      postcode TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      resolutionProvider TEXT NOT NULL,
      resolutionPrecision TEXT NOT NULL,
      county TEXT,
      district TEXT,
      country TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS source_references (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      locationId TEXT,
      providerId TEXT NOT NULL,
      externalAssetId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      originalUrl TEXT NOT NULL,
      previewUrl TEXT,
      creator TEXT NOT NULL,
      licenceName TEXT NOT NULL,
      licenceUrl TEXT,
      attributionText TEXT NOT NULL,
      commercialUseStatus TEXT NOT NULL,
      adaptationRestrictions TEXT,
      latitude REAL,
      longitude REAL,
      distanceMeters REAL,
      mediaType TEXT NOT NULL,
      workflowStatus TEXT NOT NULL,
      notes TEXT,
      discoveredAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE SET NULL,
      UNIQUE(projectId, providerId, externalAssetId)
    );

    CREATE TABLE IF NOT EXISTS shot_plans (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      locationId TEXT,
      relatedReferenceId TEXT,
      sequenceOrder INTEGER NOT NULL,
      durationSeconds INTEGER NOT NULL,
      shotType TEXT NOT NULL,
      visualObjective TEXT NOT NULL,
      movement TEXT NOT NULL,
      scriptExcerpt TEXT,
      startViewpoint TEXT,
      endViewpoint TEXT,
      productionNotes TEXT,
      preferredSource TEXT,
      licenceStatus TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE SET NULL,
      FOREIGN KEY (relatedReferenceId) REFERENCES source_references(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS local_media (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      sourceReferenceId TEXT,
      localRelativePath TEXT NOT NULL,
      originalFilename TEXT NOT NULL,
      mediaType TEXT NOT NULL,
      fileSizeBytes INTEGER NOT NULL,
      importedAt TEXT NOT NULL,
      licenceSnapshot TEXT,
      attributionSnapshot TEXT,
      notes TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (sourceReferenceId) REFERENCES source_references(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS visual_plans (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT,
      rawInput TEXT NOT NULL,
      sceneCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS script_scenes (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      visualPlanId TEXT NOT NULL,
      sceneNumber INTEGER NOT NULL,
      timecode TEXT NOT NULL,
      triggerPhrase TEXT,
      voiceover TEXT,
      searchQueries TEXT NOT NULL,
      visualNotes TEXT,
      aiPrompt TEXT,
      motionPrompt TEXT,
      targetMediaType TEXT NOT NULL,
      targetDurationSeconds INTEGER NOT NULL,
      namedLocation TEXT,
      sceneType TEXT NOT NULL,
      unparsedContent TEXT,
      searchStatus TEXT NOT NULL DEFAULT 'pending',
      selectedCandidateId TEXT,
      selectedAssetSnapshot TEXT,
      downloadStatus TEXT NOT NULL DEFAULT 'none',
      downloadedFilePath TEXT,
      downloadedFilename TEXT,
      downloadError TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (visualPlanId) REFERENCES visual_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scene_candidates (
      id TEXT PRIMARY KEY,
      sceneId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      externalAssetId TEXT NOT NULL,
      queryUsed TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      originalUrl TEXT NOT NULL,
      previewUrl TEXT NOT NULL,
      downloadUrl TEXT,
      creator TEXT NOT NULL,
      licenceName TEXT NOT NULL,
      licenceUrl TEXT,
      commercialUseStatus TEXT NOT NULL,
      mediaType TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      durationSeconds REAL,
      relevanceScore REAL NOT NULL,
      matchType TEXT NOT NULL,
      isRecommended INTEGER NOT NULL DEFAULT 0,
      geographicMatchNotes TEXT,
      discoveredAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (sceneId) REFERENCES script_scenes(id) ON DELETE CASCADE,
      UNIQUE(sceneId, providerId, externalAssetId)
    );
  `);

  dbInstance = db;
  return db;
}

// ---------------- PROJECTS ----------------
export function listProjects(): Project[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC');
  return stmt.all() as unknown as Project[];
}

export function getProject(id: string): Project | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = stmt.get(id);
  return (row as unknown as Project) || null;
}

export function createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): Project {
  const db = getDatabase();
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    createdAt: now,
    updatedAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO projects (id, title, workingVideoTitle, description, scriptExcerpt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    newProject.id,
    newProject.title,
    newProject.workingVideoTitle || null,
    newProject.description || null,
    newProject.scriptExcerpt || null,
    newProject.createdAt,
    newProject.updatedAt
  );

  return newProject;
}

export function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
): Project | null {
  const db = getDatabase();
  const existing = getProject(id);
  if (!existing) return null;

  const updated: Project = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const stmt = db.prepare(`
    UPDATE projects
    SET title = ?, workingVideoTitle = ?, description = ?, scriptExcerpt = ?, updatedAt = ?
    WHERE id = ?
  `);
  stmt.run(
    updated.title,
    updated.workingVideoTitle || null,
    updated.description || null,
    updated.scriptExcerpt || null,
    updated.updatedAt,
    id
  );

  return updated;
}

export function deleteProject(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = stmt.run(id);
  return (result.changes ?? 0) > 0;
}

// ---------------- LOCATIONS ----------------
export function getOrCreateLocation(
  data: Omit<LocationRecord, 'id' | 'createdAt'> & { id?: string }
): LocationRecord {
  const db = getDatabase();
  const existingStmt = db.prepare(
    'SELECT * FROM locations WHERE query = ? AND latitude = ? AND longitude = ?'
  );
  const existing = existingStmt.get(data.query, data.latitude, data.longitude) as unknown as LocationRecord | undefined;
  if (existing) {
    return existing;
  }

  const id = data.id || `loc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const record: LocationRecord = {
    id,
    query: data.query,
    resolvedName: data.resolvedName,
    postcode: data.postcode,
    latitude: data.latitude,
    longitude: data.longitude,
    resolutionProvider: data.resolutionProvider,
    resolutionPrecision: data.resolutionPrecision,
    county: data.county,
    district: data.district,
    country: data.country,
    createdAt: now,
  };

  const insertStmt = db.prepare(`
    INSERT INTO locations (id, query, resolvedName, postcode, latitude, longitude, resolutionProvider, resolutionPrecision, county, district, country, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(
    record.id,
    record.query,
    record.resolvedName,
    record.postcode || null,
    record.latitude,
    record.longitude,
    record.resolutionProvider,
    record.resolutionPrecision,
    record.county || null,
    record.district || null,
    record.country || null,
    record.createdAt
  );

  return record;
}

export function listRecentLocations(limit = 6): LocationRecord[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM locations ORDER BY createdAt DESC LIMIT ?');
  return stmt.all(limit) as unknown as LocationRecord[];
}

// ---------------- SOURCE REFERENCES ----------------
export function listReferencesByProject(projectId: string): SourceReference[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM source_references WHERE projectId = ? ORDER BY discoveredAt DESC'
  );
  return stmt.all(projectId) as unknown as SourceReference[];
}

export function addSourceReference(
  ref: Omit<SourceReference, 'discoveredAt'> & { discoveredAt?: string }
): { reference: SourceReference; alreadyExisted: boolean } {
  const db = getDatabase();
  const now = ref.discoveredAt || new Date().toISOString();

  // Check if duplicate exists for this project + provider + externalAssetId
  const checkStmt = db.prepare(
    'SELECT * FROM source_references WHERE projectId = ? AND providerId = ? AND externalAssetId = ?'
  );
  const existing = checkStmt.get(ref.projectId, ref.providerId, ref.externalAssetId) as unknown as SourceReference | undefined;
  if (existing) {
    return { reference: existing, alreadyExisted: true };
  }

  // Check if location exists if locationId is given
  let validLocationId: string | null = null;
  if (ref.locationId) {
    const locCheck = db.prepare('SELECT id FROM locations WHERE id = ?').get(ref.locationId);
    if (locCheck) {
      validLocationId = ref.locationId;
    }
  }

  const record: SourceReference = {
    ...ref,
    locationId: validLocationId || undefined,
    discoveredAt: now,
  };

  const insertStmt = db.prepare(`
    INSERT INTO source_references (
      id, projectId, locationId, providerId, externalAssetId, title, description,
      originalUrl, previewUrl, creator, licenceName, licenceUrl, attributionText,
      commercialUseStatus, adaptationRestrictions, latitude, longitude, distanceMeters,
      mediaType, workflowStatus, notes, discoveredAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    record.id,
    record.projectId,
    validLocationId,
    record.providerId,
    record.externalAssetId,
    record.title,
    record.description || null,
    record.originalUrl,
    record.previewUrl || null,
    record.creator,
    record.licenceName,
    record.licenceUrl || null,
    record.attributionText,
    record.commercialUseStatus,
    record.adaptationRestrictions || null,
    record.latitude ?? null,
    record.longitude ?? null,
    record.distanceMeters ?? null,
    record.mediaType,
    record.workflowStatus,
    record.notes || null,
    record.discoveredAt
  );

  return { reference: record, alreadyExisted: false };
}

export function updateSourceReference(
  id: string,
  updates: Partial<Pick<SourceReference, 'workflowStatus' | 'notes' | 'commercialUseStatus'>>
): boolean {
  const db = getDatabase();
  const current = db.prepare('SELECT * FROM source_references WHERE id = ?').get(id) as unknown as SourceReference | undefined;
  if (!current) return false;

  const newStatus = updates.workflowStatus ?? current.workflowStatus;
  const newNotes = updates.notes !== undefined ? updates.notes : current.notes;
  const newComm = updates.commercialUseStatus ?? current.commercialUseStatus;

  const stmt = db.prepare(`
    UPDATE source_references
    SET workflowStatus = ?, notes = ?, commercialUseStatus = ?
    WHERE id = ?
  `);
  stmt.run(newStatus, newNotes || null, newComm, id);
  return true;
}

export function deleteSourceReference(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM source_references WHERE id = ?');
  const res = stmt.run(id);
  return (res.changes ?? 0) > 0;
}

// ---------------- SHOT PLANS ----------------
export function listShotPlansByProject(projectId: string): ShotPlan[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM shot_plans WHERE projectId = ? ORDER BY sequenceOrder ASC'
  );
  return stmt.all(projectId) as unknown as ShotPlan[];
}

export function addShotPlan(plan: ShotPlan): ShotPlan {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO shot_plans (
      id, projectId, locationId, relatedReferenceId, sequenceOrder, durationSeconds,
      shotType, visualObjective, movement, scriptExcerpt, startViewpoint,
      endViewpoint, productionNotes, preferredSource, licenceStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    plan.id,
    plan.projectId,
    plan.locationId || null,
    plan.relatedReferenceId || null,
    plan.sequenceOrder,
    plan.durationSeconds,
    plan.shotType,
    plan.visualObjective,
    plan.movement,
    plan.scriptExcerpt || null,
    plan.startViewpoint || null,
    plan.endViewpoint || null,
    plan.productionNotes || null,
    plan.preferredSource || null,
    plan.licenceStatus || null
  );

  return plan;
}

export function updateShotPlan(id: string, updates: Partial<ShotPlan>): boolean {
  const db = getDatabase();
  const current = db.prepare('SELECT * FROM shot_plans WHERE id = ?').get(id) as unknown as ShotPlan | undefined;
  if (!current) return false;

  const updated = { ...current, ...updates };
  const stmt = db.prepare(`
    UPDATE shot_plans
    SET sequenceOrder = ?, durationSeconds = ?, shotType = ?, visualObjective = ?,
        movement = ?, scriptExcerpt = ?, startViewpoint = ?, endViewpoint = ?,
        productionNotes = ?, preferredSource = ?, licenceStatus = ?, relatedReferenceId = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.sequenceOrder,
    updated.durationSeconds,
    updated.shotType,
    updated.visualObjective,
    updated.movement,
    updated.scriptExcerpt || null,
    updated.startViewpoint || null,
    updated.endViewpoint || null,
    updated.productionNotes || null,
    updated.preferredSource || null,
    updated.licenceStatus || null,
    updated.relatedReferenceId || null,
    id
  );

  return true;
}

export function reorderShotPlans(projectId: string, orderedIds: string[]): boolean {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE shot_plans SET sequenceOrder = ? WHERE id = ? AND projectId = ?');
  orderedIds.forEach((id, index) => {
    stmt.run(index + 1, id, projectId);
  });
  return true;
}

export function deleteShotPlan(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM shot_plans WHERE id = ?');
  const res = stmt.run(id);
  return (res.changes ?? 0) > 0;
}

// ---------------- LOCAL MEDIA ----------------
export function listLocalMediaByProject(projectId: string): LocalMedia[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM local_media WHERE projectId = ? ORDER BY importedAt DESC');
  return stmt.all(projectId) as unknown as LocalMedia[];
}

export function addLocalMedia(media: LocalMedia): LocalMedia {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO local_media (
      id, projectId, sourceReferenceId, localRelativePath, originalFilename,
      mediaType, fileSizeBytes, importedAt, licenceSnapshot, attributionSnapshot, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    media.id,
    media.projectId,
    media.sourceReferenceId || null,
    media.localRelativePath,
    media.originalFilename,
    media.mediaType,
    media.fileSizeBytes,
    media.importedAt,
    media.licenceSnapshot || null,
    media.attributionSnapshot || null,
    media.notes || null
  );

  return media;
}

export function deleteLocalMedia(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM local_media WHERE id = ?');
  const res = stmt.run(id);
  return (res.changes ?? 0) > 0;
}

// ---------------- DASHBOARD AGGREGATES ----------------
export interface DashboardStats {
  totalProjects: number;
  totalSavedReferences: number;
  referencesToReview: number;
  manuallyDownloaded: number;
  importedLocally: number;
  totalShotPlans: number;
}

export function getDashboardStats(): DashboardStats {
  const db = getDatabase();
  const projCount = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
  const refCount = (db.prepare('SELECT COUNT(*) as count FROM source_references').get() as { count: number }).count;
  const reviewCount = (
    db.prepare("SELECT COUNT(*) as count FROM source_references WHERE workflowStatus = 'Licence to review'").get() as { count: number }
  ).count;
  const manualCount = (
    db.prepare("SELECT COUNT(*) as count FROM source_references WHERE workflowStatus = 'Manually downloaded'").get() as { count: number }
  ).count;
  const importedCount = (
    db.prepare("SELECT COUNT(*) as count FROM source_references WHERE workflowStatus = 'Imported locally'").get() as { count: number }
  ).count;
  const shotCount = (db.prepare('SELECT COUNT(*) as count FROM shot_plans').get() as { count: number }).count;

  return {
    totalProjects: projCount,
    totalSavedReferences: refCount,
    referencesToReview: reviewCount,
    manuallyDownloaded: manualCount,
    importedLocally: importedCount,
    totalShotPlans: shotCount,
  };
}

// ---------------- VISUAL PLANS & SCRIPT SCENES ----------------

export function createOrUpdateVisualPlan(plan: VisualPlan): VisualPlan {
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM visual_plans WHERE id = ?').get(plan.id) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE visual_plans
      SET title = ?, rawInput = ?, sceneCount = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      plan.title || null,
      plan.rawInput,
      plan.sceneCount,
      plan.updatedAt,
      plan.id
    );
  } else {
    db.prepare(`
      INSERT INTO visual_plans (id, projectId, title, rawInput, sceneCount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      plan.id,
      plan.projectId,
      plan.title || null,
      plan.rawInput,
      plan.sceneCount,
      plan.createdAt,
      plan.updatedAt
    );
  }
  return plan;
}

export function getVisualPlan(id: string): VisualPlan | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM visual_plans WHERE id = ?').get(id) as VisualPlan | undefined;
  return row || null;
}

export function getVisualPlanByProject(projectId: string): VisualPlan | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM visual_plans WHERE projectId = ? ORDER BY updatedAt DESC LIMIT 1').get(projectId) as VisualPlan | undefined;
  return row || null;
}

export function saveScriptScenes(scenes: ScriptScene[]): void {
  const db = getDatabase();
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO script_scenes (
      id, projectId, visualPlanId, sceneNumber, timecode, triggerPhrase, voiceover,
      searchQueries, visualNotes, aiPrompt, motionPrompt, targetMediaType,
      targetDurationSeconds, namedLocation, sceneType, unparsedContent,
      searchStatus, selectedCandidateId, selectedAssetSnapshot, downloadStatus,
      downloadedFilePath, downloadedFilename, downloadError, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of scenes) {
    insertStmt.run(
      s.id,
      s.projectId,
      s.visualPlanId,
      s.sceneNumber,
      s.timecode,
      s.triggerPhrase || null,
      s.voiceover || null,
      JSON.stringify(s.searchQueries || []),
      s.visualNotes || null,
      s.aiPrompt || null,
      s.motionPrompt || null,
      s.targetMediaType,
      s.targetDurationSeconds,
      s.namedLocation || null,
      s.sceneType,
      s.unparsedContent || null,
      s.searchStatus || 'pending',
      s.selectedCandidateId || null,
      s.selectedAssetSnapshot ? JSON.stringify(s.selectedAssetSnapshot) : null,
      s.downloadStatus || 'none',
      s.downloadedFilePath || null,
      s.downloadedFilename || null,
      s.downloadError || null,
      s.createdAt,
      s.updatedAt
    );
  }
}

function mapScriptSceneRow(row: any): ScriptScene {
  return {
    ...row,
    searchQueries: typeof row.searchQueries === 'string' ? JSON.parse(row.searchQueries) : row.searchQueries || [],
    selectedAssetSnapshot: row.selectedAssetSnapshot ? JSON.parse(row.selectedAssetSnapshot) : undefined,
  };
}

export function listScriptScenesByPlan(visualPlanId: string): ScriptScene[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM script_scenes WHERE visualPlanId = ? ORDER BY sceneNumber ASC').all(visualPlanId) as any[];
  return rows.map(mapScriptSceneRow);
}

export function listScriptScenesByProject(projectId: string): ScriptScene[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM script_scenes WHERE projectId = ? ORDER BY sceneNumber ASC').all(projectId) as any[];
  return rows.map(mapScriptSceneRow);
}

export function getScriptScene(id: string): ScriptScene | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM script_scenes WHERE id = ?').get(id) as any;
  return row ? mapScriptSceneRow(row) : null;
}

export function updateScriptScene(id: string, updates: Partial<ScriptScene>): ScriptScene | null {
  const existing = getScriptScene(id);
  if (!existing) return null;

  const merged: ScriptScene = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const db = getDatabase();
  db.prepare(`
    UPDATE script_scenes
    SET sceneNumber = ?, timecode = ?, triggerPhrase = ?, voiceover = ?,
        searchQueries = ?, visualNotes = ?, aiPrompt = ?, motionPrompt = ?,
        targetMediaType = ?, targetDurationSeconds = ?, namedLocation = ?,
        sceneType = ?, unparsedContent = ?, searchStatus = ?, selectedCandidateId = ?,
        selectedAssetSnapshot = ?, downloadStatus = ?, downloadedFilePath = ?,
        downloadedFilename = ?, downloadError = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    merged.sceneNumber,
    merged.timecode,
    merged.triggerPhrase || null,
    merged.voiceover || null,
    JSON.stringify(merged.searchQueries || []),
    merged.visualNotes || null,
    merged.aiPrompt || null,
    merged.motionPrompt || null,
    merged.targetMediaType,
    merged.targetDurationSeconds,
    merged.namedLocation || null,
    merged.sceneType,
    merged.unparsedContent || null,
    merged.searchStatus,
    merged.selectedCandidateId || null,
    merged.selectedAssetSnapshot ? JSON.stringify(merged.selectedAssetSnapshot) : null,
    merged.downloadStatus,
    merged.downloadedFilePath || null,
    merged.downloadedFilename || null,
    merged.downloadError || null,
    merged.updatedAt,
    id
  );

  return merged;
}

export function saveSceneCandidates(candidates: SceneCandidateResult[]): void {
  const db = getDatabase();
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO scene_candidates (
      id, sceneId, projectId, providerId, externalAssetId, queryUsed,
      title, description, originalUrl, previewUrl, downloadUrl, creator,
      licenceName, licenceUrl, commercialUseStatus, mediaType, width, height,
      durationSeconds, relevanceScore, matchType, isRecommended,
      geographicMatchNotes, discoveredAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of candidates) {
    insertStmt.run(
      c.id,
      c.sceneId,
      c.projectId,
      c.providerId,
      c.externalAssetId,
      c.queryUsed,
      c.title,
      c.description || null,
      c.originalUrl,
      c.previewUrl,
      c.downloadUrl || null,
      c.creator,
      c.licenceName,
      c.licenceUrl || null,
      c.commercialUseStatus,
      c.mediaType,
      c.width || null,
      c.height || null,
      c.durationSeconds || null,
      c.relevanceScore,
      c.matchType,
      c.isRecommended ? 1 : 0,
      c.geographicMatchNotes || null,
      c.discoveredAt
    );
  }
}

function mapCandidateRow(row: any): SceneCandidateResult {
  return {
    ...row,
    isRecommended: Boolean(row.isRecommended),
  };
}

export function listSceneCandidates(sceneId: string): SceneCandidateResult[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM scene_candidates WHERE sceneId = ? ORDER BY isRecommended DESC, relevanceScore DESC').all(sceneId) as any[];
  return rows.map(mapCandidateRow);
}

export function listSceneCandidatesByProject(projectId: string): SceneCandidateResult[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM scene_candidates WHERE projectId = ? ORDER BY sceneId, isRecommended DESC, relevanceScore DESC').all(projectId) as any[];
  return rows.map(mapCandidateRow);
}

export function selectSceneCandidate(sceneId: string, candidate: SceneCandidateResult | null): void {
  const db = getDatabase();
  if (candidate) {
    db.prepare(`
      UPDATE script_scenes
      SET selectedCandidateId = ?, selectedAssetSnapshot = ?, updatedAt = ?
      WHERE id = ?
    `).run(candidate.id, JSON.stringify(candidate), new Date().toISOString(), sceneId);
  } else {
    db.prepare(`
      UPDATE script_scenes
      SET selectedCandidateId = NULL, selectedAssetSnapshot = NULL, updatedAt = ?
      WHERE id = ?
    `).run(new Date().toISOString(), sceneId);
  }
}

export function updateSceneDownloadStatus(
  sceneId: string,
  status: SceneDownloadStatus,
  filename?: string,
  filePath?: string,
  error?: string
): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE script_scenes
    SET downloadStatus = ?, downloadedFilename = COALESCE(?, downloadedFilename),
        downloadedFilePath = COALESCE(?, downloadedFilePath), downloadError = ?,
        updatedAt = ?
    WHERE id = ?
  `).run(status, filename || null, filePath || null, error || null, new Date().toISOString(), sceneId);
}

export function isAiScene(scene: ScriptScene): boolean {
  if (scene.sceneType === 'ai_prompt') return true;
  if (!scene.aiPrompt) return false;
  const p = scene.aiPrompt.trim().toLowerCase();
  return !['none', 'n/a', 'yok', 'no', 'null', 'undefined', '-', ''].includes(p);
}

export function deduplicateSceneRecommendations(projectId: string): void {
  const db = getDatabase();
  const scenes = listScriptScenesByProject(projectId);
  const candidates = listSceneCandidatesByProject(projectId);
  if (scenes.length === 0) return;

  const usedAssetKeys = new Set<string>();
  const candidatesByScene = new Map<string, SceneCandidateResult[]>();
  for (const c of candidates) {
    if (!candidatesByScene.has(c.sceneId)) {
      candidatesByScene.set(c.sceneId, []);
    }
    candidatesByScene.get(c.sceneId)!.push(c);
  }

  const getAssetKey = (c: SceneCandidateResult) => `${c.providerId}_${c.externalAssetId}`;

  for (const scene of scenes) {
    // If scene is an AI prompt scene, it should be excluded from stock selection
    if (isAiScene(scene)) {
      if (scene.selectedCandidateId) {
        selectSceneCandidate(scene.id, null);
        scene.selectedCandidateId = undefined;
      }
      db.prepare("UPDATE script_scenes SET sceneType = 'ai_prompt' WHERE id = ?").run(scene.id);
      db.prepare("UPDATE scene_candidates SET isRecommended = 0 WHERE sceneId = ?").run(scene.id);
      continue;
    }

    const sceneCandidates = candidatesByScene.get(scene.id) || [];
    if (sceneCandidates.length === 0) continue;

    let chosenCandidate = scene.selectedCandidateId
      ? sceneCandidates.find((c) => c.id === scene.selectedCandidateId)
      : undefined;

    // If currently chosen is already used by an earlier scene, find an unused candidate for this scene
    if (!chosenCandidate || usedAssetKeys.has(getAssetKey(chosenCandidate))) {
      const unusedCandidate = sceneCandidates.find((c) => !usedAssetKeys.has(getAssetKey(c)));
      if (unusedCandidate) {
        chosenCandidate = unusedCandidate;
      } else {
        chosenCandidate = chosenCandidate || sceneCandidates[0];
      }
    }

    if (chosenCandidate) {
      usedAssetKeys.add(getAssetKey(chosenCandidate));

      // Update scene selected candidate if changed or missing
      if (scene.selectedCandidateId !== chosenCandidate.id) {
        selectSceneCandidate(scene.id, chosenCandidate);
        scene.selectedCandidateId = chosenCandidate.id;
      }

      // Update isRecommended flag in database: 1 for chosen, 0 for other candidates of this scene
      for (const c of sceneCandidates) {
        const isRec = c.id === chosenCandidate.id ? 1 : 0;
        if ((c.isRecommended ? 1 : 0) !== isRec) {
          db.prepare('UPDATE scene_candidates SET isRecommended = ? WHERE id = ?').run(isRec, c.id);
          c.isRecommended = Boolean(isRec);
        }
      }
    }
  }
}


