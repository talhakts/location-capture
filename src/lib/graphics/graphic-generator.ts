import { SceneCandidateResult } from '../types';

export interface GraphicCardParams {
  title: string; // e.g. "£45,000"
  subtitle?: string; // e.g. "2 Bed Terrace • Back Garden"
  location?: string; // e.g. "County Durham, Northern England"
  notes?: string;
  projectId: string;
  sceneId: string;
}

export class GraphicGenerator {
  public static readonly BRAND = {
    NAVY: '#1B2A41',
    CORAL: '#FD9E76',
    CREAM: '#F5F0E6',
    CHARCOAL: '#2B2B2B',
    WHITE: '#FFFFFF',
    MUTED: '#71717A',
  };

  /**
   * Generates a 1920x1080 SVG graphic card matching Britain Off Map brand palette
   */
  public static generateSvg(params: GraphicCardParams): string {
    const title = params.title || '£45,000';
    const subtitle = params.subtitle || '2 Bed Terrace • Rear Garden';
    const location = params.location || 'County Durham • Northern England';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${this.BRAND.CREAM}" />
      <stop offset="100%" stop-color="#EBE4D5" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#1B2A41" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1920" height="1080" fill="url(#bgGrad)" />

  <!-- Subtle Documentary Grid Pattern -->
  <g opacity="0.06" stroke="${this.BRAND.NAVY}" stroke-width="1.5">
    <line x1="160" y1="0" x2="160" y2="1080" />
    <line x1="960" y1="0" x2="960" y2="1080" stroke-dasharray="8 8" />
    <line x1="1760" y1="0" x2="1760" y2="1080" />
    <line x1="0" y1="120" x2="1920" y2="120" />
    <line x1="0" y1="540" x2="1920" y2="540" stroke-dasharray="8 8" />
    <line x1="0" y1="960" x2="1920" y2="960" />
  </g>

  <!-- Outer Frame -->
  <rect x="60" y="60" width="1800" height="960" rx="16" fill="none" stroke="${this.BRAND.NAVY}" stroke-width="6" />
  <rect x="74" y="74" width="1772" height="932" rx="10" fill="none" stroke="${this.BRAND.CORAL}" stroke-width="2" opacity="0.7" />

  <!-- Center Presentation Card -->
  <g filter="url(#cardShadow)">
    <rect x="360" y="240" width="1200" height="600" rx="24" fill="${this.BRAND.WHITE}" stroke="${this.BRAND.NAVY}" stroke-width="4" />
  </g>

  <!-- Top Brand Tag -->
  <g transform="translate(960, 310)">
    <rect x="-190" y="-22" width="380" height="44" rx="22" fill="${this.BRAND.NAVY}" />
    <text text-anchor="middle" y="7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800" letter-spacing="3" fill="${this.BRAND.CORAL}">
      BRITAIN OFF MAP • PROPERTY BRIEF
    </text>
  </g>

  <!-- Main Headline / Price -->
  <text x="960" y="490" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="112" font-weight="900" letter-spacing="-2" fill="${this.BRAND.NAVY}">
    ${title}
  </text>

  <!-- Coral Accent Divider -->
  <line x1="660" y1="540" x2="1260" y2="540" stroke="${this.BRAND.CORAL}" stroke-width="5" stroke-linecap="round" />

  <!-- Subtitle (Key Property Attributes) -->
  <text x="960" y="620" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="36" font-weight="600" fill="${this.BRAND.CHARCOAL}">
    ${subtitle}
  </text>

  <!-- Location Badge -->
  <g transform="translate(960, 710)">
    <rect x="-240" y="-20" width="480" height="40" rx="8" fill="${this.BRAND.CREAM}" stroke="${this.BRAND.NAVY}" stroke-width="1.5" />
    <text text-anchor="middle" y="6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="${this.BRAND.NAVY}">
      📍 ${location}
    </text>
  </g>

  <!-- Corner Documentary Crosshairs -->
  <g stroke="${this.BRAND.NAVY}" stroke-width="2">
    <path d="M 90 110 L 90 90 L 110 90" fill="none" />
    <path d="M 1830 110 L 1830 90 L 1810 90" fill="none" />
    <path d="M 90 970 L 90 990 L 110 990" fill="none" />
    <path d="M 1830 970 L 1830 990 L 1810 990" fill="none" />
  </g>
</svg>`;
  }

  /**
   * Generates a data URI string for direct browser img src
   */
  public static generateDataUri(params: GraphicCardParams): string {
    const svg = this.generateSvg(params);
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Converts SVG graphic to candidate search result item
   */
  public static createCandidate(params: GraphicCardParams): SceneCandidateResult {
    const svg = this.generateSvg(params);
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    const now = new Date().toISOString();

    return {
      id: `graphic_${params.sceneId}_${Date.now()}`,
      sceneId: params.sceneId,
      projectId: params.projectId,
      providerId: 'custom_graphic',
      externalAssetId: `graphic_${params.sceneId}`,
      queryUsed: params.title,
      title: `Custom Graphic: ${params.title}`,
      description: `Generated 1080p documentary graphic card: "${params.title} — ${params.subtitle || ''}".`,
      originalUrl: dataUri,
      previewUrl: dataUri,
      downloadUrl: dataUri,
      creator: 'Britain Off Map Graphics Engine',
      licenceName: 'Original Production Asset (All Rights Reserved / Owned)',
      commercialUseStatus: 'verified_commercial',
      mediaType: 'graphic' as any,
      width: 1920,
      height: 1080,
      relevanceScore: 1.0,
      matchType: 'custom_graphic',
      isRecommended: true,
      geographicMatchNotes: params.location || 'Produced internally for project',
      discoveredAt: now,
    };
  }
}
