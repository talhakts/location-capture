import { NextResponse } from 'next/server';
import { getDashboardStats, listRecentLocations } from '@/lib/database/db';

export async function GET() {
  try {
    const key = process.env.GEOGRAPH_API_KEY ? process.env.GEOGRAPH_API_KEY.trim() : '';
    const hasGeographKey = Boolean(key);
    const pexelsKey = process.env.PEXELS_API_KEY ? process.env.PEXELS_API_KEY.trim() : '';
    const hasPexelsKey = Boolean(pexelsKey);
    const stats = getDashboardStats();
    const recentLocations = listRecentLocations(8);

    return NextResponse.json({
      success: true,
      config: {
        hasGeographKey,
        geographKey: key, // Local desktop research tool; exposes key to user's browser client for JSONP
        hasPexelsKey,
        databaseStatus: 'connected',
        platform: process.platform,
        appName: 'Location Capture',
        channel: 'Britain Off Map',
      },
      stats,
      recentLocations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch system config' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const body = await req.json();
    const { pexelsKey, geographKey } = body;

    const envPath = path.join(process.cwd(), '.env.local');
    let currentEnv = '';
    if (fs.existsSync(envPath)) {
      currentEnv = fs.readFileSync(envPath, 'utf8');
    }

    if (pexelsKey !== undefined) {
      const cleanKey = pexelsKey.trim();
      process.env.PEXELS_API_KEY = cleanKey;
      if (currentEnv.includes('PEXELS_API_KEY=')) {
        currentEnv = currentEnv.replace(/PEXELS_API_KEY=.*(\r?\n|$)/, `PEXELS_API_KEY=${cleanKey}$1`);
      } else {
        currentEnv += `\nPEXELS_API_KEY=${cleanKey}\n`;
      }
    }

    if (geographKey !== undefined) {
      const cleanKey = geographKey.trim();
      process.env.GEOGRAPH_API_KEY = cleanKey;
      if (currentEnv.includes('GEOGRAPH_API_KEY=')) {
        currentEnv = currentEnv.replace(/GEOGRAPH_API_KEY=.*(\r?\n|$)/, `GEOGRAPH_API_KEY=${cleanKey}$1`);
      } else {
        currentEnv += `\nGEOGRAPH_API_KEY=${cleanKey}\n`;
      }
    }

    fs.writeFileSync(envPath, currentEnv.trim() + '\n', 'utf8');

    return NextResponse.json({
      success: true,
      hasPexelsKey: Boolean(process.env.PEXELS_API_KEY),
      hasGeographKey: Boolean(process.env.GEOGRAPH_API_KEY),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}

