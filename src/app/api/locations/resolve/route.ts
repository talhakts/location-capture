import { NextResponse } from 'next/server';
import { LocationResolver } from '@/lib/location/resolver';
import { getOrCreateLocation } from '@/lib/database/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const candidates = await LocationResolver.resolve(query.trim());

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        candidates: [],
        message: `No UK location found for "${query}". Try a UK postcode (e.g. LA4, HU19, SR8), town (e.g. Morecambe), village, or landmark.`,
      });
    }

    // Persist the primary resolved candidate to the database history
    const primary = candidates[0];
    const savedRecord = getOrCreateLocation({
      query: query.trim(),
      resolvedName: primary.resolvedName,
      postcode: primary.postcode,
      latitude: primary.latitude,
      longitude: primary.longitude,
      resolutionProvider: primary.resolutionProvider,
      resolutionPrecision: primary.resolutionPrecision,
      county: primary.county,
      district: primary.district,
      country: primary.country,
    });

    return NextResponse.json({
      success: true,
      primaryLocation: savedRecord,
      candidates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Location resolution failed' },
      { status: 500 }
    );
  }
}
