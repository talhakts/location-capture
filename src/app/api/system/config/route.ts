import { NextResponse } from 'next/server';
import { getDashboardStats, listRecentLocations } from '@/lib/database/db';

export async function GET() {
  try {
    const key = process.env.GEOGRAPH_API_KEY ? process.env.GEOGRAPH_API_KEY.trim() : '';
    const hasGeographKey = Boolean(key);
    const stats = getDashboardStats();
    const recentLocations = listRecentLocations(8);

    return NextResponse.json({
      success: true,
      config: {
        hasGeographKey,
        geographKey: key, // Local desktop research tool; exposes key to user's browser client for JSONP
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
