import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VisualPlanParser,
  extractSearchQueries,
  extractDurationFromText,
  timecodeToSeconds
} from '../src/lib/script-parser/parser';
import {
  generatePredictableFilename,
  slugify
} from '../src/lib/storage/project-asset-downloader';
import { GraphicGenerator } from '../src/lib/graphics/graphic-generator';
import { BatchExportManager } from '../src/lib/exports/batch-export-manager';
import { PexelsAdapter } from '../src/lib/providers/pexels-adapter';
import {
  createProject,
  deleteProject,
  createOrUpdateVisualPlan,
  saveScriptScenes,
  listScriptScenesByPlan,
  saveSceneCandidates,
  listSceneCandidates,
  selectSceneCandidate,
  updateSceneDownloadStatus,
  getScriptScene
} from '../src/lib/database/db';
import { Project, ScriptScene, SceneCandidateResult } from '../src/lib/types';

const SAMPLE_NINE_SCENE_PLAN = `1 | 0:00 | trigger: "Here's"
Voiceover: "Here's a two-bedroom terrace in County Durham with a back garden..."
Stock: Northern England terraced houses → British terraced houses street → UK red brick terrace row
Notes: Exterior, understated, grey sky. Keep the visual world consistent with the thumbnail.
AI prompt: Photorealistic exterior of a two-storey Northern English red-brick terraced house in County Durham, front door and two windows, small front yard wall, overcast natural daylight, muted colours, eye-level 35mm documentary look, no people, no text.
Motion: Very slow push-in toward the front door, slight handheld drift, 6 seconds.

2 | 0:03 | trigger: "back garden"
Voiceover: "A tidy rear yard that could easily be transformed."
Stock: terraced house back garden UK → British back yard washing line → English rear garden terrace
Notes: Small but tidy rear garden.
Motion: Gentle pan, 6 seconds.

3 | 0:06 | trigger: "primary school"
Voiceover: "Just around the corner sits the local primary school..."
Stock: UK primary school exterior → British school gates → English primary school playground
Notes: Keep readable signs and logos out of frame where possible.
Motion: Static establishing shot, 8 seconds.

4 | 0:10 | trigger: "fish and chips"
Voiceover: "The village fish and chip shop remains the social hub of the high street."
Stock: British fish and chip shop exterior → Northern England local chippy → UK traditional takeaway storefront
Notes: Real community feel, brick pavement.
Motion: Slow right-to-left tracking pass, 6 seconds.

5 | 0:14 | trigger: "1970s heyday"
Voiceover: "In the 1970s, miners would line up here every Friday evening."
Stock: 1970s British mining village street → historic Northern England pit town archive → vintage UK terraced street 1970s
Notes: Historic reconstruction or archival tone.
AI prompt: 1970s vintage photograph of a bustling Northern England coal mining village high street, vintage British cars parked, miners walking in flat caps, muted Kodachrome film grain look, 1974.
Motion: Slow digital push-in on still photograph, 6 seconds.

6 | 0:18 | trigger: "£45,000"
Voiceover: "And the asking price on the open market? Just forty-five thousand pounds."
Stock: price card £45,000 → custom graphic property card
Notes: Custom graphic card: "£45,000" with cream background, navy border, and description "2 bed terrace • back garden".
Motion: Center pop-in with subtle float, 6 seconds.

7 | 0:22 | trigger: "for sale"
Voiceover: "Houses like this attract property investors from across the South East."
Stock: UK for sale board outside terraced house → estate agent board British street → house sold sign UK
Notes: Estate agent board in foreground.
Motion: Depth-of-field rack focus from for-sale sign to street, 6 seconds.

8 | 0:26 | trigger: "tidy street"
Voiceover: "A peaceful row of homes with panoramic coastal views just over the crest."
Stock: neat British terraced street → quiet Northern England village road → clean red brick terraces
Notes: Long view down street.
Motion: Slow forward gimbal walk, 8 seconds.

9 | 0:32 | trigger: "North Sea coast"
Voiceover: "Walking past the final terrace reveals the untamed expanse of the Durham heritage coast."
Stock: Easington Colliery coastal path → Durham heritage coast cliffs → North Sea crashing on northern British beach
Notes: Dramatic coastal horizon.
Motion: Wide aerial drone pull-back revealing coastline, 8 seconds.`;

test('1. Visual Plan Parser: 9-Scene County Durham Parsing', () => {
  const result = VisualPlanParser.parse(SAMPLE_NINE_SCENE_PLAN, 'proj_test_1', 'plan_test_1');
  assert.equal(result.scenes.length, 9, 'Should parse exactly 9 scenes');

  // Scene 1
  const s1 = result.scenes[0];
  assert.equal(s1.sceneNumber, 1);
  assert.equal(s1.timecode, '0:00');
  assert.equal(s1.triggerPhrase, "Here's");
  assert.ok(s1.voiceover?.includes('two-bedroom terrace in County Durham'));
  assert.equal(s1.searchQueries.length, 3);
  assert.equal(s1.searchQueries[0], 'Northern England terraced houses');
  assert.equal(s1.searchQueries[1], 'British terraced houses street');
  assert.equal(s1.searchQueries[2], 'UK red brick terrace row');
  assert.ok(s1.aiPrompt?.includes('Photorealistic exterior'));
  assert.equal(s1.targetDurationSeconds, 6);
  assert.equal(s1.namedLocation, 'County Durham');

  // Scene 6: Custom Graphic
  const s6 = result.scenes[5];
  assert.equal(s6.sceneNumber, 6);
  assert.equal(s6.timecode, '0:18');
  assert.equal(s6.triggerPhrase, '£45,000');
  assert.equal(s6.sceneType, 'custom_graphic');
  assert.equal(s6.targetMediaType, 'graphic');

  // Scene 9: Coastal Scene
  const s9 = result.scenes[8];
  assert.equal(s9.sceneNumber, 9);
  assert.equal(s9.timecode, '0:32');
  assert.equal(s9.targetDurationSeconds, 8);
  assert.ok(s9.searchQueries.some((q) => q.includes('Easington Colliery coastal path')));
});

test('2. Timecode & Query Utilities', () => {
  assert.equal(timecodeToSeconds('0:00'), 0);
  assert.equal(timecodeToSeconds('0:03'), 3);
  assert.equal(timecodeToSeconds('01:30'), 90);
  assert.equal(timecodeToSeconds('01:00:05'), 3605);

  assert.equal(extractDurationFromText('Slow push-in, 6 seconds.'), 6);
  assert.equal(extractDurationFromText('Aerial reveal, 8s duration'), 8);
  assert.equal(extractDurationFromText('No duration specified'), null);

  const queries = extractSearchQueries('term A → term B -> term C | term D');
  assert.deepEqual(queries, ['term A', 'term B', 'term C', 'term D']);
});

test('3. Stable Numbered Filename Generation & Path Safety', () => {
  // Padded numbers 01, 02, etc.
  const fn1 = generatePredictableFilename(1, 'Terraced House Exterior', 'photograph');
  assert.equal(fn1, '01_terraced-house-exterior.jpg');

  const fn2 = generatePredictableFilename(3, 'Primary School Playground', 'video');
  assert.equal(fn2, '03_primary-school-playground.mp4');

  const fn6 = generatePredictableFilename(6, '£45,000 Property Card', 'graphic');
  assert.equal(fn6, '06_45-000-property-card.svg');

  const fnAlt = generatePredictableFilename(1, 'Terraced House Exterior', 'photograph', 'B');
  assert.equal(fnAlt, '01B_terraced-house-exterior.jpg');

  // Slug safety
  assert.equal(slugify('The Town That Refused to Fade!!'), 'the-town-that-refused-to-fade');
});

test('4. Custom Graphic SVG Generation (Britain Off Map Branding)', () => {
  const svg = GraphicGenerator.generateSvg({
    title: '£45,000',
    subtitle: '2 Bed Terrace • Back Garden',
    location: 'County Durham • Northern England',
    projectId: 'p1',
    sceneId: 's6',
  });

  assert.ok(svg.includes('1920'), 'Width should be 1920');
  assert.ok(svg.includes('1080'), 'Height should be 1080');
  assert.ok(svg.includes('#1B2A41'), 'Brand Navy should be present');
  assert.ok(svg.includes('#FD9E76'), 'Brand Coral should be present');
  assert.ok(svg.includes('£45,000'), 'Title price should be rendered');
  assert.ok(svg.includes('BRITAIN OFF MAP'), 'Brand tag should be present');

  const cand = GraphicGenerator.createCandidate({
    title: '£45,000',
    subtitle: '2 Bed Terrace • Back Garden',
    projectId: 'p1',
    sceneId: 's6',
  });
  assert.equal(cand.providerId, 'custom_graphic');
  assert.equal(cand.matchType, 'custom_graphic');
  assert.equal(cand.commercialUseStatus, 'verified_commercial');
  assert.ok(cand.downloadUrl?.startsWith('data:image/svg+xml;base64,'));
});

test('5. Pexels Adapter: Mapping & Demo Mock Validation', () => {
  const pexels = new PexelsAdapter();
  assert.equal(pexels.id, 'pexels');
  assert.equal(pexels.capabilities.search, true);
  assert.equal(pexels.capabilities.directDownload, true);

  // Test photo mapping
  const mockPhotoResult = pexels.mapPhotoToResult(
    {
      id: 998877,
      width: 1920,
      height: 1080,
      url: 'https://www.pexels.com/photo/998877',
      photographer: 'Alice Smith',
      photographer_url: 'https://www.pexels.com/@alice',
      photographer_id: 123,
      avg_color: '#555',
      src: {
        original: 'https://images.pexels.com/original.jpg',
        large2x: 'https://images.pexels.com/large2x.jpg',
        large: 'https://images.pexels.com/large.jpg',
        medium: 'https://images.pexels.com/medium.jpg',
        small: 'https://images.pexels.com/small.jpg',
        portrait: 'https://images.pexels.com/portrait.jpg',
        landscape: 'https://images.pexels.com/landscape.jpg',
        tiny: 'https://images.pexels.com/tiny.jpg',
      },
      alt: 'Victorian Terraces in Durham',
    },
    'Northern England terraced houses'
  );

  assert.equal(mockPhotoResult.externalAssetId, '998877');
  assert.equal(mockPhotoResult.creator, 'Alice Smith');
  assert.equal(mockPhotoResult.commercialUseStatus, 'verified_commercial');
  assert.equal(mockPhotoResult.mediaType, 'photograph');
  assert.equal(mockPhotoResult.downloadUrl, 'https://images.pexels.com/original.jpg');

  // Test video mapping
  const mockVideoResult = pexels.mapVideoToResult(
    {
      id: 887766,
      width: 1920,
      height: 1080,
      duration: 12,
      url: 'https://www.pexels.com/video/887766',
      image: 'https://images.pexels.com/thumb.jpg',
      user: { id: 456, name: 'Bob Jones', url: 'https://www.pexels.com/@bob' },
      video_files: [
        {
          id: 1,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 1920,
          height: 1080,
          link: 'https://download.pexels.com/video-1080p.mp4',
        },
      ],
    },
    'primary school exterior'
  );

  assert.equal(mockVideoResult.externalAssetId, '887766');
  assert.equal(mockVideoResult.mediaType, 'video');
  assert.equal(mockVideoResult.downloadUrl, 'https://download.pexels.com/video-1080p.mp4');
});

test('6. Database: VisualPlan, ScriptScene & Candidate CRUD', () => {
  const testProjId = `test_p_${Date.now()}`;
  createProject({ id: testProjId, title: 'County Durham Documentary' });

  const planId = `plan_${testProjId}`;
  createOrUpdateVisualPlan({
    id: planId,
    projectId: testProjId,
    title: 'County Durham Plan',
    rawInput: SAMPLE_NINE_SCENE_PLAN,
    sceneCount: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const parsed = VisualPlanParser.parse(SAMPLE_NINE_SCENE_PLAN, testProjId, planId);
  saveScriptScenes(parsed.scenes);

  const fetchedScenes = listScriptScenesByPlan(planId);
  assert.equal(fetchedScenes.length, 9);
  assert.equal(fetchedScenes[0].sceneNumber, 1);
  assert.equal(fetchedScenes[5].sceneNumber, 6);

  // Add Candidate
  const cand: SceneCandidateResult = {
    id: `cand_1`,
    sceneId: fetchedScenes[0].id,
    projectId: testProjId,
    providerId: 'pexels',
    externalAssetId: 'px_101',
    queryUsed: 'Northern England terraced houses',
    title: 'Terraced Houses in Durham',
    originalUrl: 'https://pexels.com/101',
    previewUrl: 'https://pexels.com/thumb.jpg',
    downloadUrl: 'https://pexels.com/img.jpg',
    creator: 'David Miller',
    licenceName: 'Pexels License',
    commercialUseStatus: 'verified_commercial',
    mediaType: 'photograph',
    relevanceScore: 0.9,
    matchType: 'exact_location',
    isRecommended: true,
    discoveredAt: new Date().toISOString(),
  };

  saveSceneCandidates([cand]);
  const cands = listSceneCandidates(fetchedScenes[0].id);
  assert.equal(cands.length, 1);
  assert.equal(cands[0].externalAssetId, 'px_101');

  // Select Candidate
  selectSceneCandidate(fetchedScenes[0].id, cand);
  const updatedScene = getScriptScene(fetchedScenes[0].id);
  assert.equal(updatedScene?.selectedCandidateId, 'cand_1');

  // Update Download Status
  updateSceneDownloadStatus(
    fetchedScenes[0].id,
    'completed',
    '01_terraced-houses-in-durham.jpg',
    'Britain-Off-Map-Projects/county-durham-documentary/assets/01_terraced-houses-in-durham.jpg'
  );
  const downloadedScene = getScriptScene(fetchedScenes[0].id);
  assert.equal(downloadedScene?.downloadStatus, 'completed');
  assert.equal(downloadedScene?.downloadedFilename, '01_terraced-houses-in-durham.jpg');

  // Cleanup
  deleteProject(testProjId);
});

test('7. Output Metadata Generation (CSV, Markdown Shot List, Attribution & Manifest)', () => {
  const project: Project = {
    id: 'proj_meta',
    title: 'Durham Coastal Episode',
    workingVideoTitle: 'The British Town That Refused to Fade',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scene: ScriptScene = {
    id: 's_01',
    projectId: 'proj_meta',
    visualPlanId: 'vp_1',
    sceneNumber: 1,
    timecode: '0:00',
    triggerPhrase: "Here's",
    voiceover: "Here's a two-bedroom terrace in County Durham...",
    searchQueries: ['Northern England terraced houses'],
    targetMediaType: 'photo',
    targetDurationSeconds: 6,
    sceneType: 'stock',
    searchStatus: 'completed',
    selectedCandidateId: 'c_01',
    downloadStatus: 'completed',
    downloadedFilename: '01_terraced-houses.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const candidate: SceneCandidateResult = {
    id: 'c_01',
    sceneId: 's_01',
    projectId: 'proj_meta',
    providerId: 'pexels',
    externalAssetId: 'px_777',
    queryUsed: 'Northern England terraced houses',
    title: 'Victorian Terraces in Durham',
    originalUrl: 'https://pexels.com/photo/777',
    previewUrl: 'https://pexels.com/preview.jpg',
    downloadUrl: 'https://pexels.com/photo.jpg',
    creator: 'Sarah Jenkins',
    licenceName: 'Pexels License (Commercial)',
    commercialUseStatus: 'verified_commercial',
    mediaType: 'photograph',
    relevanceScore: 0.95,
    matchType: 'exact_location',
    isRecommended: true,
    discoveredAt: new Date().toISOString(),
  };

  const candMap = new Map([['c_01', candidate]]);

  // CSV
  const csv = BatchExportManager.generateAssetMapCsv([scene], candMap);
  assert.ok(csv.includes('01_terraced-houses.jpg'));
  assert.ok(csv.includes('Sarah Jenkins'));
  assert.ok(csv.includes('Pexels License'));

  // Shot list
  const shotList = BatchExportManager.generateShotList(project, [scene], candMap);
  assert.ok(shotList.includes('Scene #01 | 0:00 (6s)'));
  assert.ok(shotList.includes('Cue / Trigger:'));
  assert.ok(shotList.includes("Here's"));
  assert.ok(shotList.includes('Victorian Terraces in Durham'));

  // Attribution report
  const attr = BatchExportManager.generateAttributionReport(project, [scene], candMap);
  assert.ok(attr.includes('Sarah Jenkins via Pexels'));
  assert.ok(attr.includes('https://pexels.com/photo/777'));

  // Manifest JSON
  const manifest = BatchExportManager.generateManifestJson(project, [scene], candMap, [candidate]);
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.project.title, 'Durham Coastal Episode');
  assert.equal(parsed.scenes[0].downloadedFilename, '01_terraced-houses.jpg');
});
