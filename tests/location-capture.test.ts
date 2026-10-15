import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLocationInput } from '../src/lib/location/postcode-normalizer';
import { calculateDistanceMeters, formatGeographAttribution } from '../src/lib/providers/geograph-adapter';
import { GoogleMapsAdapter } from '../src/lib/providers/google-maps-adapter';
import { GoogleEarthStudioAdapter } from '../src/lib/providers/google-earth-adapter';
import { sourceRegistry } from '../src/lib/providers/registry';
import { sanitizeFilename } from '../src/lib/storage/media-manager';
import { ExportManager } from '../src/lib/exports/export-manager';
import {
  createProject,
  getProject,
  deleteProject,
  addSourceReference,
  listReferencesByProject,
  addShotPlan,
  reorderShotPlans,
  listShotPlansByProject,
} from '../src/lib/database/db';
import { Project, SourceReference, ShotPlan } from '../src/lib/types';

test('1. Postcode and Input Normalization', () => {
  // Full postcodes
  const full1 = analyzeLocationInput('la4 5aa');
  assert.equal(full1.type, 'full_postcode');
  assert.equal(full1.normalized, 'LA4 5AA');

  const full2 = analyzeLocationInput('sr81dy');
  assert.equal(full2.type, 'full_postcode');
  assert.equal(full2.normalized, 'SR8 1DY');

  // Outcodes
  const out1 = analyzeLocationInput('LA4');
  assert.equal(out1.type, 'outcode');
  assert.equal(out1.normalized, 'LA4');

  const out2 = analyzeLocationInput('hu19');
  assert.equal(out2.type, 'outcode');
  assert.equal(out2.normalized, 'HU19');

  // Towns / villages / street names
  const place1 = analyzeLocationInput('Morecambe');
  assert.equal(place1.type, 'placename_or_address');
  assert.equal(place1.normalized, 'Morecambe');

  const place2 = analyzeLocationInput('Easington, County Durham');
  assert.equal(place2.type, 'placename_or_address');
  assert.equal(place2.normalized, 'Easington, County Durham');
});

test('2. Geographic Distance & Attribution Formatting', () => {
  // Distance between Morecambe Promenade (54.0723, -2.8630) and nearby point
  const dist = calculateDistanceMeters(54.0723, -2.863, 54.0745, -2.8641);
  assert.ok(dist > 200 && dist < 400, `Expected distance ~250m, got ${dist}`);

  // Format Geograph Attribution
  const attr = formatGeographAttribution('David Stowell', '6485401', 'Terraced Street');
  assert.ok(attr.includes('David Stowell'));
  assert.ok(attr.includes('CC BY-SA 2.0'));
  assert.ok(attr.includes('https://www.geograph.org.uk/photo/6485401'));
  assert.ok(attr.includes('ShareAlike clause applies'));
});

test('3. Provider Registry & Adapter Capabilities', () => {
  const geograph = sourceRegistry.getGeographAdapter();
  assert.ok(geograph);
  assert.equal(geograph.capabilities.search, true);
  assert.equal(geograph.capabilities.directDownload, false); // Rights-aware: no unauthorized downloads

  const maps = sourceRegistry.get('google_maps');
  assert.ok(maps);
  assert.equal(maps.capabilities.externalInspection, true);
  assert.equal(maps.capabilities.search, false); // Does not harvest or scrape maps

  const earth = sourceRegistry.get('google_earth');
  assert.ok(earth);
  assert.ok(earth.capabilities.termsNotes?.includes('Commercial Use Warning'));
});

test('4. Google Maps & Google Earth Inspection URLs', () => {
  const mapsUrl = GoogleMapsAdapter.getMapsUrl(54.0723, -2.863);
  assert.equal(mapsUrl, 'https://www.google.com/maps/search/?api=1&query=54.0723,-2.863');

  const streetViewUrl = GoogleMapsAdapter.getStreetViewUrl(54.0723, -2.863);
  assert.equal(streetViewUrl, 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=54.0723,-2.863');

  const studioUrl = GoogleEarthStudioAdapter.getStudioUrl();
  assert.equal(studioUrl, 'https://earth.google.com/studio/');
});

test('5. Media Storage Path Safety & Sanitization', () => {
  // Path traversal prevention
  const dangerous = '../../../../etc/passwd';
  const clean = sanitizeFilename(dangerous);
  assert.ok(!clean.includes('/'));
  assert.ok(!clean.includes('\\'));
  assert.ok(!clean.includes('..'));

  const windowsPath = 'C:\\Windows\\System32\\cmd.exe';
  const cleanWin = sanitizeFilename(windowsPath);
  assert.ok(!cleanWin.includes(':'));
  assert.ok(!cleanWin.includes('\\'));
});

test('6. Database Project CRUD & Duplicate Reference Prevention', () => {
  const testProjectId = `test_proj_${Date.now()}`;
  const created = createProject({
    id: testProjectId,
    title: 'Morecambe Coastline Episode',
    workingVideoTitle: 'The Town That Refused to Fade',
    description: 'Documentary exploring Victorian housing and coastal regeneration.',
  });
  assert.equal(created.id, testProjectId);

  const fetched = getProject(testProjectId);
  assert.ok(fetched);
  assert.equal(fetched.title, 'Morecambe Coastline Episode');

  // Add reference
  const ref1 = addSourceReference({
    id: `ref_test_1`,
    projectId: testProjectId,
    providerId: 'geograph',
    externalAssetId: '999001',
    title: 'Victorian Terraces',
    originalUrl: 'https://www.geograph.org.uk/photo/999001',
    creator: 'Test Photographer',
    licenceName: 'CC BY-SA 2.0',
    attributionText: 'Test Attribution',
    commercialUseStatus: 'verified_commercial',
    mediaType: 'photograph',
    workflowStatus: 'Shortlisted',
  });
  assert.equal(ref1.alreadyExisted, false);

  // Attempt duplicate addition for same project + provider + asset ID
  const refDup = addSourceReference({
    id: `ref_test_dup`,
    projectId: testProjectId,
    providerId: 'geograph',
    externalAssetId: '999001',
    title: 'Duplicate Attempt',
    originalUrl: 'https://www.geograph.org.uk/photo/999001',
    creator: 'Test Photographer',
    licenceName: 'CC BY-SA 2.0',
    attributionText: 'Test Attribution',
    commercialUseStatus: 'verified_commercial',
    mediaType: 'photograph',
    workflowStatus: 'Shortlisted',
  });
  assert.equal(refDup.alreadyExisted, true);

  const allRefs = listReferencesByProject(testProjectId);
  assert.equal(allRefs.length, 1);

  // Cleanup
  deleteProject(testProjectId);
  assert.equal(getProject(testProjectId), null);
});

test('7. Shot Plan Sequence & Reordering', () => {
  const testProj = `test_shot_proj_${Date.now()}`;
  createProject({ id: testProj, title: 'Shot Sequence Test' });

  const shot1 = addShotPlan({
    id: `s1_${Date.now()}`,
    projectId: testProj,
    sequenceOrder: 1,
    durationSeconds: 8,
    shotType: 'Wide establishing shot',
    visualObjective: 'Establish Morecambe Bay expanse',
    movement: 'Slow push-in',
    scriptExcerpt: 'Between the tide and the promenade lies Britain in miniature.',
  });

  const shot2 = addShotPlan({
    id: `s2_${Date.now()}`,
    projectId: testProj,
    sequenceOrder: 2,
    durationSeconds: 6,
    shotType: 'Row of terraced houses',
    visualObjective: 'Capture red-brick rhythm',
    movement: 'Left-to-right reveal',
  });

  let shots = listShotPlansByProject(testProj);
  assert.equal(shots.length, 2);
  assert.equal(shots[0].id, shot1.id);
  assert.equal(shots[1].id, shot2.id);

  // Reorder shots: shot2 first, shot1 second
  reorderShotPlans(testProj, [shot2.id, shot1.id]);
  shots = listShotPlansByProject(testProj);
  assert.equal(shots[0].id, shot2.id);
  assert.equal(shots[1].id, shot1.id);
  assert.equal(shots[0].sequenceOrder, 1);
  assert.equal(shots[1].sequenceOrder, 2);

  deleteProject(testProj);
});

test('8. Export Generation (JSON, CSV, Attribution & Shotlist)', () => {
  const project: Project = {
    id: 'export_proj',
    title: 'Durham Coastal Colliery Heritage',
    workingVideoTitle: 'The Vanished Pits of Durham',
    description: 'A study of former pit villages.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const references: SourceReference[] = [
    {
      id: 'ref_1',
      projectId: 'export_proj',
      providerId: 'geograph',
      externalAssetId: '12345',
      title: 'Colliery Memorial',
      originalUrl: 'https://www.geograph.org.uk/photo/12345',
      creator: 'John Walker',
      licenceName: 'CC BY-SA 2.0',
      attributionText: 'Photo © John Walker CC BY-SA 2.0',
      commercialUseStatus: 'verified_commercial',
      mediaType: 'photograph',
      workflowStatus: 'Ready to use',
      discoveredAt: new Date().toISOString(),
    },
  ];

  const shots: ShotPlan[] = [
    {
      id: 'shot_1',
      projectId: 'export_proj',
      sequenceOrder: 1,
      durationSeconds: 8,
      shotType: 'Historic site overview',
      visualObjective: 'Show monument against North Sea',
      movement: 'Gentle pan',
      scriptExcerpt: 'Where heavy industry once dominated, silence now watches the waves.',
    },
  ];

  // Test JSON manifest
  const jsonManifest = ExportManager.generateJsonManifest(project, references, shots, []);
  const parsed = JSON.parse(jsonManifest);
  assert.equal(parsed.project.title, 'Durham Coastal Colliery Heritage');
  assert.equal(parsed.stats.totalReferences, 1);
  assert.equal(parsed.stats.totalShots, 1);

  // Test CSV export
  const csv = ExportManager.generateReferencesCsv(references);
  assert.ok(csv.includes('Colliery Memorial'));
  assert.ok(csv.includes('John Walker'));
  assert.ok(csv.includes('CC BY-SA 2.0'));

  // Test Attribution Report
  const attrReport = ExportManager.generateAttributionReport(project, references);
  assert.ok(attrReport.includes('Durham Coastal Colliery Heritage'));
  assert.ok(attrReport.includes('John Walker'));
  assert.ok(attrReport.includes('ShareAlike Clause (CC BY-SA 2.0)'));

  // Test Shot List Report
  const shotList = ExportManager.generateShotList(project, shots, references);
  assert.ok(shotList.includes('Historic site overview (8s)'));
  assert.ok(shotList.includes('Gentle pan'));
  assert.ok(shotList.includes('Where heavy industry once dominated'));
});

test('9. Location Resolution for Streets & Postcodes (Grosvenor Street in Blackpool)', async () => {
  const { LocationResolver } = await import('../src/lib/location/resolver');

  // Test full postcode
  const pcResults = await LocationResolver.resolve('FY1 3HD');
  assert.ok(pcResults.length > 0);
  assert.equal(pcResults[0].postcode, 'FY1 3HD');

  // Test street query with natural language "in Blackpool"
  const streetResults = await LocationResolver.resolve('Grosvenor Street in Blackpool');
  assert.ok(streetResults.length > 0);
  const match = streetResults.find((r) => r.resolvedName.toLowerCase().includes('blackpool'));
  assert.ok(match, 'Expected at least one candidate containing Blackpool');
  assert.ok(match.latitude > 50 && match.latitude < 60);
  assert.ok(match.longitude < 0);
});

