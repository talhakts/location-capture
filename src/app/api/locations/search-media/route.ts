import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sourceRegistry } from '@/lib/providers/registry';
import { GoogleMapsAdapter } from '@/lib/providers/google-maps-adapter';
import { GoogleEarthStudioAdapter } from '@/lib/providers/google-earth-adapter';

const SearchMediaSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().min(1),
  postcode: z.string().optional(),
  radiusKm: z.number().min(1).max(20).default(5),
  queryText: z.string().optional(),
  useDemoData: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SearchMediaSchema.parse(body);

    const geographAdapter = sourceRegistry.getGeographAdapter();
    const apiKey = process.env.GEOGRAPH_API_KEY;

    let photoResults: any[] = [];
    let providerError: string | null = null;
    let usedDemoData = parsed.useDemoData;

    try {
      photoResults = await geographAdapter.search({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        locationName: parsed.locationName,
        postcode: parsed.postcode,
        radiusKm: parsed.radiusKm,
        queryText: parsed.queryText,
        useDemoData: parsed.useDemoData,
      });
    } catch (err: any) {
      providerError = err.message || 'Geograph API hatası';
      // If server-side fetch failed (e.g. Cloudflare block), fallback to demo data smoothly without popping up modals!
      try {
        photoResults = await geographAdapter.search({
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          locationName: parsed.locationName,
          postcode: parsed.postcode,
          radiusKm: parsed.radiusKm,
          queryText: parsed.queryText,
          useDemoData: true,
        });
        usedDemoData = true;
      } catch {
        photoResults = [];
      }
    }

    // Generate inspection tools items (Google Maps / Earth Studio)
    const mapsAdapter = sourceRegistry.get('google_maps') as GoogleMapsAdapter;
    const earthAdapter = sourceRegistry.get('google_earth') as GoogleEarthStudioAdapter;

    const [mapInspectionResults, earthPlanningResults] = await Promise.all([
      mapsAdapter.search({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        locationName: parsed.locationName,
      }),
      earthAdapter.search({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        locationName: parsed.locationName,
      }),
    ]);

    return NextResponse.json({
      success: true,
      queryCoordinates: {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      },
      results: {
        photographs: photoResults,
        inspectionTools: [...mapInspectionResults, ...earthPlanningResults],
      },
      stats: {
        totalPhotographsFound: photoResults.length,
        radiusKm: parsed.radiusKm,
        usedDemoData,
      },
      providerError,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Arama işlemi tamamlanamadı' },
      { status: 500 }
    );
  }
}
