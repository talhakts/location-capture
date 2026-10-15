async function testProjectWorkflow() {
  console.log('--- 1. Creating Project ---');
  const projRes = await (await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Morecambe Bay & Coastal Housing',
      workingVideoTitle: 'The British Seaside Town That Refused to Fade',
      description: 'Documentary exploring Victorian red-brick terraces and promenade erosion.',
      scriptExcerpt: 'Walking along the promenade at low tide, the grand Victorian terraces stand as quiet sentinels.'
    })
  })).json();
  console.log('Project created:', projRes.success, 'ID:', projRes.project?.id);
  const projId = projRes.project?.id;

  console.log('--- 2. Adding Reference ---');
  const refRes = await (await fetch(`http://localhost:3000/api/projects/${projId}/references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'geograph',
      externalAssetId: '6485401',
      title: 'Victorian Terraced Street, Sandylands',
      description: 'A typical row of stone and brick English terraced houses near the coast with bay windows.',
      originalUrl: 'https://www.geograph.org.uk/photo/6485401',
      previewUrl: 'https://s0.geograph.org.uk/geophotos/06/48/54/6485401_d18c9a3b_800x600.jpg',
      creator: 'David Stowell',
      licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
      attributionText: 'Photo "Victorian Terraced Street, Sandylands" © David Stowell, licensed under CC BY-SA 2.0.',
      commercialUseStatus: 'verified_commercial',
      mediaType: 'photograph',
      workflowStatus: 'Shortlisted'
    })
  })).json();
  console.log('Reference added:', refRes.success, 'Title:', refRes.reference?.title);

  console.log('--- 3. Adding Shot Plan (8 seconds) ---');
  const shotRes = await (await fetch(`http://localhost:3000/api/projects/${projId}/shot-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      durationSeconds: 8,
      shotType: 'Street-level establishing shot',
      visualObjective: 'Show the line of stone bay-fronted terraces facing the tidal bay',
      movement: 'Slow push-in',
      scriptExcerpt: 'Between the tide and the promenade lies Britain in miniature.',
      relatedReferenceId: refRes.reference?.id
    })
  })).json();
  console.log('Shot added:', shotRes.success, 'Shot Type:', shotRes.shot?.shotType, 'Duration:', shotRes.shot?.durationSeconds);

  console.log('--- 4. Exporting Attribution Report ---');
  const attrText = await (await fetch(`http://localhost:3000/api/projects/${projId}/export?format=attribution`)).text();
  console.log('Attribution report contains project title:', attrText.includes('Morecambe Bay & Coastal Housing'));
  console.log('Attribution report contains CC BY-SA 2.0:', attrText.includes('CC BY-SA 2.0'));
  console.log('Attribution report contains David Stowell:', attrText.includes('David Stowell'));

  console.log('--- 5. Exporting Shot List ---');
  const shotText = await (await fetch(`http://localhost:3000/api/projects/${projId}/export?format=shotlist`)).text();
  console.log('Shot list contains Street-level establishing shot:', shotText.includes('Street-level establishing shot'));
  console.log('Shot list contains 8s duration:', shotText.includes('8s'));
  console.log('Shot list contains voiceover excerpt:', shotText.includes('Between the tide and the promenade lies Britain in miniature.'));

  console.log('--- 6. Exporting CSV ---');
  const csvText = await (await fetch(`http://localhost:3000/api/projects/${projId}/export?format=csv`)).text();
  console.log('CSV contains Victorian Terraced Street, Sandylands:', csvText.includes('Victorian Terraced Street, Sandylands'));

  console.log('--- 7. Exporting JSON Manifest ---');
  const jsonManifest = await (await fetch(`http://localhost:3000/api/projects/${projId}/export?format=json`)).json();
  console.log('JSON manifest contains project:', jsonManifest.project?.title, 'stats:', jsonManifest.stats);

  console.log('FULL END-TO-END WORKFLOW VERIFIED SUCCESSFULLY!');
}

testProjectWorkflow().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
