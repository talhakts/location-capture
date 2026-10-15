import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  Project,
  LocationRecord,
  SourceReference,
  ShotPlan,
  LocalMedia,
  WorkflowStatus
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

  // Enable WAL and Foreign Keys
  db.exec('PRAGMA journal_mode = WAL;');
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
