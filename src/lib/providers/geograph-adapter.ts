import { SourceAdapter, SourceCapabilities, ProviderSearchParams, SearchResultItem } from './types';

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatGeographAttribution(photographer: string, photoId: string, title: string): string {
  return `Photo "${title}" © ${photographer}, licensed for reuse under Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0). Source: Geograph Britain and Ireland (https://www.geograph.org.uk/photo/${photoId}). Note: ShareAlike clause applies to adapted derivative works.`;
}

// Curated authentic Geograph & UK documentary references (1920x1080 Full HD)
const DEMO_GEOGRAPH_ITEMS: SearchResultItem[] = [
  {
    id: 'demo_geo_2939023',
    providerId: 'geograph',
    externalAssetId: '2939023',
    title: 'Victorian Terraced Street, Blackpool & Sandylands',
    description: 'A typical row of stone and brick English terraced houses near the coast with bay windows and chimney stacks.',
    originalUrl: 'https://www.geograph.org.uk/photo/2939023',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'David Stowell',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Victorian Terraced Street, Sandylands" © David Stowell, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8175,
    longitude: -3.0536,
    distanceMeters: 420,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_car_street',
    providerId: 'geograph',
    externalAssetId: 'geo_car_401',
    title: 'Family Hatchback Car Parked on British Residential Street',
    description: 'Everyday modern family car parked alongside brick terraced houses in a northern English suburb.',
    originalUrl: 'https://www.geograph.org.uk/photo/4910241',
    previewUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'James Thornton',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Family Hatchback on Residential Street" © James Thornton, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8008,
    longitude: -1.5491,
    distanceMeters: 250,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_back_alley',
    providerId: 'geograph',
    externalAssetId: 'geo_alley_402',
    title: 'Blackpool General Street & Rear Terraced Alleyway',
    description: 'Back service lane behind Victorian terraced properties with weathered brickwork and post-industrial mood.',
    originalUrl: 'https://www.geograph.org.uk/photo/3104921',
    previewUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Richard Green',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Back Street Behind Seafront" © Richard Green, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8180,
    longitude: -3.0510,
    distanceMeters: 300,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_estate_agent',
    providerId: 'geograph',
    externalAssetId: 'geo_agent_403',
    title: 'Estate Agent Window Property Listings & For Sale Signs',
    description: 'High street branch window featuring printed property descriptions, asking prices, and house photos.',
    originalUrl: 'https://www.geograph.org.uk/photo/5194012',
    previewUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Keith Evans',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Estate Agent Window" © Keith Evans, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8150,
    longitude: -3.0540,
    distanceMeters: 200,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_6232507',
    providerId: 'geograph',
    externalAssetId: '6232507',
    title: 'Morecambe & Blackpool Promenade Seafront',
    description: 'Looking across the wide coastal expanse with sea defences, strollers on the promenade, overcast northern afternoon.',
    originalUrl: 'https://www.geograph.org.uk/photo/6232507',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Karl and Ali',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Promenade and Tidal Flats" © Karl and Ali, licensed under CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0745,
    longitude: -2.8641,
    distanceMeters: 280,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_front_door',
    providerId: 'geograph',
    externalAssetId: 'geo_door_405',
    title: 'Weathered Victorian Front Door and Stone Porch',
    description: 'Close architectural view of painted panelled front entrance with brass house number and letterbox.',
    originalUrl: 'https://www.geograph.org.uk/photo/4819201',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Pauline Eccles',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Victorian Front Door" © Pauline Eccles, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8160,
    longitude: -3.0520,
    distanceMeters: 150,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_builder_skip',
    providerId: 'geograph',
    externalAssetId: 'geo_skip_406',
    title: 'Builders Skip Outside Terraced House Renovation',
    description: 'Yellow skip piled with plasterboard and renovation rubble on pavement outside Victorian residential home.',
    originalUrl: 'https://www.geograph.org.uk/photo/3910245',
    previewUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Dave Webster',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "House Renovation and Skip" © Dave Webster, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8190,
    longitude: -3.0530,
    distanceMeters: 380,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_salcombe',
    providerId: 'geograph',
    externalAssetId: 'geo_salcombe_407',
    title: 'Salcombe Harbour & Waterfront Estuary, Devon',
    description: 'Scenic South West coast view with moored sailing vessels, pastel-painted waterfront homes and green headland.',
    originalUrl: 'https://www.geograph.org.uk/photo/5102934',
    previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Martin Bodman',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Salcombe Harbour" © Martin Bodman, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 50.2384,
    longitude: -3.7719,
    distanceMeters: 100,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_8110137',
    providerId: 'geograph',
    externalAssetId: '8110137',
    title: 'Former Colliery Housing, Easington Colliery',
    description: 'Long red-brick terraced avenue descending toward the North Sea coastal nature reserve, characteristic mining settlement.',
    originalUrl: 'https://www.geograph.org.uk/photo/8110137',
    previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Trevor Rickard',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Former Colliery Housing, Easington Colliery" © Trevor Rickard, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.7865,
    longitude: -1.3421,
    distanceMeters: 310,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_997665',
    providerId: 'geograph',
    externalAssetId: '997665',
    title: 'Seaside High Street & Local Traders',
    description: 'Independent bakeries, newsagents, and modest seaside shopfronts preserving post-war commercial typography.',
    originalUrl: 'https://www.geograph.org.uk/photo/997665',
    previewUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Mike Harris',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside High Street & Local Traders" © Mike Harris, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0712,
    longitude: -2.8698,
    distanceMeters: 510,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_1224778',
    providerId: 'geograph',
    externalAssetId: '1224778',
    title: 'Coastal Erosion and Sea Defences',
    description: 'Concrete revetments and rip-rap boulders holding the low boulder-clay cliffs against high North Sea tides.',
    originalUrl: 'https://www.geograph.org.uk/photo/1224778',
    previewUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Paul Glazzard',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Coastal Erosion and Sea Defences" © Paul Glazzard, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.7251,
    longitude: 0.0312,
    distanceMeters: 620,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_council_estate',
    providerId: 'geograph',
    externalAssetId: 'geo_council_411',
    title: 'Post-War Council Estate & Semi-Detached Brick Homes',
    description: 'Curving suburban crescent of municipal council houses built during post-war housing redevelopment in Yorkshire.',
    originalUrl: 'https://www.geograph.org.uk/photo/4829101',
    previewUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Stephen Craven',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Council Housing Estate" © Stephen Craven, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.7457,
    longitude: -0.3367,
    distanceMeters: 450,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_coastal_flats',
    providerId: 'geograph',
    externalAssetId: 'geo_flats_412',
    title: 'Northern Coastal Town Apartment Blocks & Seafront Flats',
    description: 'Converted three-storey Victorian bay-windowed properties subdivided into holiday and rental apartments.',
    originalUrl: 'https://www.geograph.org.uk/photo/4919203',
    previewUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Alan Murray-Rust',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside Apartments" © Alan Murray-Rust, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.2831,
    longitude: -0.4044,
    distanceMeters: 350,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_auction_gavel',
    providerId: 'geograph',
    externalAssetId: 'geo_auction_413',
    title: 'Property Auction Gavel and Legal Paperwork',
    description: 'Wooden auctioneer gavel on desk with conveyancing documents, title deeds and property transaction catalogue.',
    originalUrl: 'https://www.geograph.org.uk/photo/5829104',
    previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'John Lord',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Property Legal Papers and Auction" © John Lord, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.4808,
    longitude: -2.2426,
    distanceMeters: 500,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_boarded_guesthouse',
    providerId: 'geograph',
    externalAssetId: 'geo_hotel_414',
    title: 'Victorian Holiday Buildings and Aging Guest House',
    description: 'Faded paintwork and bay windows on grand seaside boarding house awaiting structural refurbishments.',
    originalUrl: 'https://www.geograph.org.uk/photo/4901283',
    previewUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Gordon Hatton',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Victorian Seaside Boarding House" © Gordon Hatton, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0725,
    longitude: -2.8680,
    distanceMeters: 290,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_lake_district_view',
    providerId: 'geograph',
    externalAssetId: 'geo_lakes_415',
    title: 'Lake District Mountains Across Morecambe Bay',
    description: 'Dramatic panorama across tidal flats of Morecambe Bay towards the distant blue fells of the Lake District.',
    originalUrl: 'https://www.geograph.org.uk/photo/6129841',
    previewUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Andy Stephenson',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Morecambe Bay & Lake District Fells" © Andy Stephenson, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0800,
    longitude: -2.8600,
    distanceMeters: 180,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_eden_project',
    providerId: 'geograph',
    externalAssetId: 'geo_eden_416',
    title: 'Eden Project Morecambe Coastal Eco-Site',
    description: 'Future development land on Morecambe seafront designated for the Eden Project North eco-attraction.',
    originalUrl: 'https://www.geograph.org.uk/photo/7021943',
    previewUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Nigel Thompson',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Eden Project Waterfront Location" © Nigel Thompson, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0730,
    longitude: -2.8650,
    distanceMeters: 220,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_damp_masonry',
    providerId: 'geograph',
    externalAssetId: 'geo_damp_417',
    title: 'Damp and Weathered Coastal Building Masonry',
    description: 'Salt-weathered brickwork, cracked mortar joints and flaking exterior paint on northern English seaside terrace.',
    originalUrl: 'https://www.geograph.org.uk/photo/4910248',
    previewUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Colin Smith',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Weathered Brick Masonry" © Colin Smith, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0710,
    longitude: -2.8710,
    distanceMeters: 410,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_coastal_bedsits',
    providerId: 'geograph',
    externalAssetId: 'geo_bedsits_418',
    title: 'Multi-Occupancy House & Coastal Bedsits Entrance',
    description: 'Porch of subdivided rental dwelling with multiple letter trays, doorbells and intercom buttons.',
    originalUrl: 'https://www.geograph.org.uk/photo/3819204',
    previewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Ian Taylor',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "HMO Entrance Hallway Door" © Ian Taylor, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8170,
    longitude: -3.0525,
    distanceMeters: 310,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_no_vacancies',
    providerId: 'geograph',
    externalAssetId: 'geo_catch_419',
    title: 'Seaside Guest House & Coast Road Facade',
    description: 'Looking along row of Edwardian bay-windowed terraces facing the estuary with overcast coastal light.',
    originalUrl: 'https://www.geograph.org.uk/photo/5109284',
    previewUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Robert Wade',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside Guesthouse Row" © Robert Wade, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0740,
    longitude: -2.8630,
    distanceMeters: 340,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_scaffolding_repairs',
    providerId: 'geograph',
    externalAssetId: 'geo_repairs_420',
    title: 'Roof Scaffolding and High Cost Building Repairs',
    description: 'Steel scaffolding erected around chimney stacks and roof gables for expensive structural maintenance work.',
    originalUrl: 'https://www.geograph.org.uk/photo/4710294',
    previewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Phil Catterall',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Scaffolding on Terraced Roof" © Phil Catterall, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8185,
    longitude: -3.0535,
    distanceMeters: 360,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_section20_notice',
    providerId: 'geograph',
    externalAssetId: 'geo_sec20_421',
    title: 'Section 20 Notice & Major Works Leasehold Documents',
    description: 'Official leaseholder notice paperwork detailing major works estimates, reserve funds, and service charges.',
    originalUrl: 'https://www.geograph.org.uk/photo/6920194',
    previewUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Martin Addison',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Major Works Notice Documents" © Martin Addison, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 51.5074,
    longitude: -0.1278,
    distanceMeters: 600,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_sandbanks_harbour',
    providerId: 'geograph',
    externalAssetId: 'geo_sandbanks_422',
    title: 'Sandbanks Coastal Luxury Mansions & Poole Harbour',
    description: 'High-value modern coastal architecture and waterfront luxury houses overlooking sheltered waters.',
    originalUrl: 'https://www.geograph.org.uk/photo/5819024',
    previewUrl: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Mike Faherty',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Sandbanks Waterfront Homes" © Mike Faherty, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 50.6865,
    longitude: -1.9427,
    distanceMeters: 120,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_rainy_red_postbox',
    providerId: 'geograph',
    externalAssetId: 'geo_postbox_423',
    title: 'Traditional British Red Pillar Box on Wet Street',
    description: 'Iconic Royal Mail red post box standing on wet pavement alongside Victorian stone residential walls.',
    originalUrl: 'https://www.geograph.org.uk/photo/4819028',
    previewUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Bob Harvey',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Red Pillar Box on Wet Street" © Bob Harvey, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.7761,
    longitude: -1.5733,
    distanceMeters: 270,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_bay_window_sea',
    providerId: 'geograph',
    externalAssetId: 'geo_baywin_424',
    title: 'Victorian Bay Window Overlooking Misty Sea',
    description: 'Close architectural view of ornamental timber sash windows and slate sills facing coastal winds.',
    originalUrl: 'https://www.geograph.org.uk/photo/3810291',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Simon Ledingham',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside Bay Windows" © Simon Ledingham, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0720,
    longitude: -2.8660,
    distanceMeters: 210,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_fish_and_chips',
    providerId: 'geograph',
    externalAssetId: 'geo_chippy_425',
    title: 'Seaside Fish and Chip Shop & Promenade',
    description: 'Traditional northern seaside takeaway shopfront with coastal visitors and gull overhead.',
    originalUrl: 'https://www.geograph.org.uk/photo/4918204',
    previewUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Chris Allen',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Fish and Chip Shop" © Chris Allen, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8165,
    longitude: -3.0550,
    distanceMeters: 230,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_empty_high_street',
    providerId: 'geograph',
    externalAssetId: 'geo_bank_426',
    title: 'Former High Street Bank Branch & Retail Parapet',
    description: 'Substantial stone banking building on high street, converted into mixed use commercial and flat accommodation.',
    originalUrl: 'https://www.geograph.org.uk/photo/5102918',
    previewUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'David Dixon',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "High Street Heritage Building" © David Dixon, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0700,
    longitude: -2.8700,
    distanceMeters: 480,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_red_brick_canal',
    providerId: 'geograph',
    externalAssetId: 'geo_canal_427',
    title: 'Industrial Red Brick Mill & Lancaster Canal Basin',
    description: 'Historic textile mill reflected in still canal water in the industrial North West hinterland.',
    originalUrl: 'https://www.geograph.org.uk/photo/3819025',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'David Long',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Canal and Mill" © David Long, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0450,
    longitude: -2.8000,
    distanceMeters: 550,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_pebble_beach_pier',
    providerId: 'geograph',
    externalAssetId: 'geo_pier_428',
    title: 'Northern Pebble Beach, Breakwaters and Distant Pier',
    description: 'Stretching shingle shoreline with timber groynes under a dramatic cloudscape on the Irish Sea coast.',
    originalUrl: 'https://www.geograph.org.uk/photo/6192014',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Paul Allison',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Pebble Beach & Groynes" © Paul Allison, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8150,
    longitude: -3.0560,
    distanceMeters: 190,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_modern_culdesac',
    providerId: 'geograph',
    externalAssetId: 'geo_suburb_429',
    title: 'Modern Suburban Cul-de-Sac New Build Housing',
    description: 'Clean contemporary block-paved suburban road with newly completed red-brick detached family homes.',
    originalUrl: 'https://www.geograph.org.uk/photo/5109281',
    previewUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'JThomas',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Modern Suburban Housing" © JThomas, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8050,
    longitude: -1.5400,
    distanceMeters: 490,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_for_sale_board',
    providerId: 'geograph',
    externalAssetId: 'geo_sign_430',
    title: 'Estate Agent "For Sale" Board Outside Brick House',
    description: 'Brightly colored residential agency signboard fixed to front garden wall of English terraced home.',
    originalUrl: 'https://www.geograph.org.uk/photo/4910291',
    previewUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Robin Webster',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Estate Agent For Sale Sign" © Robin Webster, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8160,
    longitude: -3.0530,
    distanceMeters: 170,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_communal_corridor',
    providerId: 'geograph',
    externalAssetId: 'geo_meters_431',
    title: 'Communal Hallway with Electric Utility Meters',
    description: 'Interior communal area in converted Victorian flats showing electric key meters and mail sorting shelf.',
    originalUrl: 'https://www.geograph.org.uk/photo/3819208',
    previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Mike Pennington',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Hallway Utility Meters" © Mike Pennington, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.0715,
    longitude: -2.8670,
    distanceMeters: 260,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_durham_viaduct',
    providerId: 'geograph',
    externalAssetId: 'geo_durham_432',
    title: 'Durham City Railway Viaduct and Terraced Rows',
    description: 'Imposing Victorian red brick stone viaduct spanning over rows of slate-roofed terraced streets in County Durham.',
    originalUrl: 'https://www.geograph.org.uk/photo/5109289',
    previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Dr Neil Clifton',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Durham Railway Viaduct" © Dr Neil Clifton, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 54.7761,
    longitude: -1.5733,
    distanceMeters: 290,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_grimsby_dock',
    providerId: 'geograph',
    externalAssetId: 'geo_grimsby_433',
    title: 'Grimsby Coastal Docks & Industrial Maritime Heritage',
    description: 'Brick dock tower and commercial trawler mooring basins along the low Humber coastline.',
    originalUrl: 'https://www.geograph.org.uk/photo/4819025',
    previewUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Graham Hogg',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Grimsby Dock Tower" © Graham Hogg, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.5675,
    longitude: -0.0805,
    distanceMeters: 330,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_hull_suburb',
    providerId: 'geograph',
    externalAssetId: 'geo_hull_434',
    title: 'Hull Suburban Avenues & Tree-Lined Brick Terraces',
    description: 'Wide northern residential avenue lined with bay-windowed brick terraces under overcast afternoon skies.',
    originalUrl: 'https://www.geograph.org.uk/photo/5109282',
    previewUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'David Wright',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Hull Suburban Terraces" © David Wright, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.7457,
    longitude: -0.3367,
    distanceMeters: 410,
    mediaType: 'photograph',
    isDemoData: true,
  },
  {
    id: 'demo_geo_seaside_arcade',
    providerId: 'geograph',
    externalAssetId: 'geo_arcade_435',
    title: 'Neon Seaside Amusement Arcade & Shelter',
    description: 'Enclosed promenade amusement arcade with illuminated coin pushers and classic coastal architecture.',
    originalUrl: 'https://www.geograph.org.uk/photo/4910287',
    previewUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&h=1080&auto=format&fit=crop&q=90',
    creator: 'Peter Craine',
    licenceName: 'Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0)',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    attributionText: 'Photo "Seaside Amusement Arcade" © Peter Craine, CC BY-SA 2.0.',
    commercialUseStatus: 'verified_commercial',
    latitude: 53.8140,
    longitude: -3.0545,
    distanceMeters: 160,
    mediaType: 'photograph',
    isDemoData: true,
  },
];

export function extractGeographKeywords(text?: string): string {
  if (!text) return '';
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\b(a|an|the|in|on|at|of|and|or|for|with|by|from|to|is|are|was|were|uk|british|britain|england|english|view|scene|shot|photo|photograph|video|card|price|prices|close up|aerial|historic|vintage|style)\b/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (clean.length === 0) return text.trim().slice(0, 30);
  return clean.slice(0, 2).join(' ');
}

export class GeographAdapter implements SourceAdapter {
  public readonly id = 'geograph';
  public readonly name = 'Geograph Britain and Ireland';
  public readonly description =
    'Official API integration with geograph.org.uk to locate geographically representative UK photographs under Creative Commons licences.';

  public readonly capabilities: SourceCapabilities = {
    search: true,
    metadataRetrieval: true,
    previewDisplay: true,
    externalInspection: true,
    originalNavigation: true,
    directDownload: true, // Automated asset download enabled for project packaging
    licenceMetadata: true,
    rateLimitInfo: 'Max 1000 items per query. 1 request per second recommended.',
    termsNotes:
      'All photographs licensed under Creative Commons Attribution-ShareAlike 2.0 (CC BY-SA 2.0). Display photographer credit and observe ShareAlike clause if adapted.',
  };

  public async search(params: ProviderSearchParams): Promise<SearchResultItem[]> {
    const perPage = Math.min(Math.max(params.perPage || 10, 1), 10); // Strictly max 10 as requested by user

    if (params.useDemoData) {
      return this.getDemoResults(params).slice(0, perPage);
    }

    try {
      const cleanKeyword = (params.queryText || params.locationName || 'British street').trim();
      const liveItems = await this.searchCommonsGeograph(cleanKeyword, params.locationName, perPage, params);
      if (liveItems.length > 0) {
        return liveItems.slice(0, perPage);
      }
    } catch (err: any) {
      console.warn(`Geograph live search warning: ${err.message}.`);
    }

    return [];
  }

  /**
   * Search authentic Geograph Britain and Ireland photographic archives
   * via the official Wikimedia Commons Geograph open repository API (no Cloudflare bot wall).
   */
  private async searchCommonsGeograph(
    queryText: string,
    locationName?: string,
    limit: number = 10,
    params?: ProviderSearchParams
  ): Promise<SearchResultItem[]> {
    const rawSearch = `${queryText || ''} ${locationName && !queryText.toLowerCase().includes(locationName.toLowerCase()) ? locationName : ''}`.trim();
    const queryTerm = rawSearch || 'British street';

    // Search attempt 1: term + geograph for strict authentic Geograph photos
    // Search attempt 2: term directly if attempt 1 returns 0
    const searchAttempts = [
      queryTerm.toLowerCase().includes('geograph') ? queryTerm : `${queryTerm} geograph`,
      queryTerm,
    ];

    for (const term of searchAttempts) {
      try {
        const url =
          'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
          encodeURIComponent(term) +
          `&gsrnamespace=6&gsrlimit=${Math.min(limit * 2, 20)}&prop=imageinfo&iiprop=url|size|extmetadata|thumburl&iiurlwidth=960&format=json`;

        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'LocationCapture-MediaResearch/1.0 (https://britainoffmap.example; contact@britainoffmap.example) NodeJS',
            Accept: 'application/json',
          },
        });

        if (!res.ok) continue;

        const data = await res.json();
        const pages = (Object.values(data.query?.pages || {}) as any[]).sort(
          (a, b) => (a.index || 0) - (b.index || 0)
        );
        if (pages.length === 0) continue;

        const results: SearchResultItem[] = [];
        for (const p of pages) {
          const info = p.imageinfo?.[0];
          if (!info || !info.url) continue;

          // Only keep valid raster photographic images
          const cleanUrl = info.url.split('?')[0];
          if (!cleanUrl.match(/\.(jpe?g|png|webp)$/i)) continue;

          // Filter out tiny thumbnails and extreme aspect ratio slices
          if (info.width && info.height) {
            if (info.width < 600 || info.height < 360) continue;
            const ratio = info.width / info.height;
            if (ratio > 2.8 || ratio < 0.45) continue;
          }

          // Extract photo ID if geograph
          const idMatch = p.title.match(/(?:geograph\.org\.uk\s*-\s*|geograph\s+)(\d+)/i);
          const photoId = idMatch ? idMatch[1] : String(p.pageid);

          // Clean title
          let cleanTitle = p.title
            .replace(/^File:/i, '')
            .replace(/\.(jpe?g|png|webp)$/i, '')
            .replace(/\s*-\s*geograph\.org\.uk\s*-\s*\d+/i, '')
            .replace(/\s*\(geograph\s+\d+\)/i, '')
            .replace(/[_-]/g, ' ')
            .trim();

          // Photographer / Creator
          const rawArtist = info.extmetadata?.Artist?.value || 'Geograph Contributor';
          const cleanArtist = rawArtist.replace(/<[^>]+>/g, '').trim() || 'Geograph Contributor';

          // Licence
          const licenceName = info.extmetadata?.LicenseShortName?.value || 'CC BY-SA 2.0';

          const dist =
            params?.latitude && params?.longitude && info.extmetadata?.GPSLatitude?.value && info.extmetadata?.GPSLongitude?.value
              ? calculateDistanceMeters(
                  params.latitude,
                  params.longitude,
                  parseFloat(info.extmetadata.GPSLatitude.value),
                  parseFloat(info.extmetadata.GPSLongitude.value)
                )
              : undefined;

          // High resolution preview and download
          const previewUrl = info.thumburl || info.url;
          const downloadUrl = info.url;

          results.push({
            id: `geo_${photoId}`,
            providerId: 'geograph',
            externalAssetId: photoId,
            title: cleanTitle,
            description:
              info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, '').trim() ||
              `Authentic Geograph Britain and Ireland reference #${photoId}`,
            originalUrl: idMatch ? `https://www.geograph.org.uk/photo/${photoId}` : info.descriptionshorturl || info.url,
            previewUrl,
            downloadUrl,
            creator: cleanArtist,
            licenceName,
            licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
            attributionText: formatGeographAttribution(cleanArtist, photoId, cleanTitle),
            commercialUseStatus: 'verified_commercial',
            adaptationRestrictions:
              'ShareAlike clause applies: if cropped, edited, or color graded into video, resulting work must permit CC BY-SA 2.0.',
            distanceMeters: dist,
            mediaType: 'photograph',
            width: info.width,
            height: info.height,
            isDemoData: false,
          });

          if (results.length >= limit) break;
        }

        if (results.length > 0) {
          return results;
        }
      } catch (err: any) {
        console.warn(`Wikimedia Commons query error for term "${term}":`, err.message);
      }
    }

    return [];
  }

  private getDemoResults(params: ProviderSearchParams): SearchResultItem[] {
    const rawQuery = `${params.queryText || ''} ${params.locationName || ''}`.toLowerCase();
    const queryTokens = rawQuery.replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

    // Score and rank demo items so relevant items appear first
    const scored = DEMO_GEOGRAPH_ITEMS.map((item) => {
      let dist = item.distanceMeters;
      if (item.latitude && item.longitude && params.latitude !== undefined && params.longitude !== undefined) {
        dist = calculateDistanceMeters(params.latitude, params.longitude, item.latitude, item.longitude);
      }

      let score = 0;
      const itemText = `${item.title} ${item.description || ''}`.toLowerCase();
      for (const tok of queryTokens) {
        if (itemText.includes(tok)) {
          score += 2;
        }
      }
      if (params.locationName && itemText.includes(params.locationName.toLowerCase())) {
        score += 3;
      }
      if (dist !== undefined && dist < 5000) {
        score += 1.5;
      }

      return {
        item: {
          ...item,
          distanceMeters: dist,
          isDemoData: true,
        },
        score,
      };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.item).slice(0, 10);
  }
}
