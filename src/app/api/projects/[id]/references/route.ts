import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listReferencesByProject,
  addSourceReference,
  updateSourceReference,
  deleteSourceReference,
} from '@/lib/database/db';
import { WorkflowStatus, CommercialUseStatus, MediaType } from '@/lib/types';

const AddReferenceSchema = z.object({
  locationId: z.string().optional(),
  providerId: z.enum(['geograph', 'google_maps', 'google_earth', 'manual_upload', 'stock_video']),
  externalAssetId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  originalUrl: z.string().url(),
  previewUrl: z.string().optional(),
  creator: z.string(),
  licenceName: z.string(),
  licenceUrl: z.string().optional(),
  attributionText: z.string(),
  commercialUseStatus: z.enum([
    'verified_commercial',
    'restricted',
    'unverified',
    'permission_required',
    'not_approved',
  ]),
  adaptationRestrictions: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  distanceMeters: z.number().optional(),
  mediaType: z.enum(['photograph', 'video', 'map_reference', 'shot_plan']),
  workflowStatus: z
    .enum([
      'Discovered',
      'Shortlisted',
      'Licence to review',
      'Ready to use',
      'Manually downloaded',
      'Imported locally',
      'Used in edit',
      'Rejected',
    ])
    .default('Shortlisted'),
  notes: z.string().optional(),
});

const UpdateReferenceSchema = z.object({
  id: z.string(),
  workflowStatus: z
    .enum([
      'Discovered',
      'Shortlisted',
      'Licence to review',
      'Ready to use',
      'Manually downloaded',
      'Imported locally',
      'Used in edit',
      'Rejected',
    ])
    .optional(),
  notes: z.string().optional(),
  commercialUseStatus: z
    .enum([
      'verified_commercial',
      'restricted',
      'unverified',
      'permission_required',
      'not_approved',
    ])
    .optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const references = listReferencesByProject(id);
    return NextResponse.json({ success: true, references });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list references' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = AddReferenceSchema.parse(body);

    const refId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const result = addSourceReference({
      id: refId,
      projectId: id,
      locationId: parsed.locationId,
      providerId: parsed.providerId,
      externalAssetId: parsed.externalAssetId,
      title: parsed.title,
      description: parsed.description,
      originalUrl: parsed.originalUrl,
      previewUrl: parsed.previewUrl,
      creator: parsed.creator,
      licenceName: parsed.licenceName,
      licenceUrl: parsed.licenceUrl,
      attributionText: parsed.attributionText,
      commercialUseStatus: parsed.commercialUseStatus as CommercialUseStatus,
      adaptationRestrictions: parsed.adaptationRestrictions,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      distanceMeters: parsed.distanceMeters,
      mediaType: parsed.mediaType as MediaType,
      workflowStatus: parsed.workflowStatus as WorkflowStatus,
      notes: parsed.notes,
    });

    return NextResponse.json(
      {
        success: true,
        reference: result.reference,
        alreadyExisted: result.alreadyExisted,
        message: result.alreadyExisted
          ? 'Reference already in project collection'
          : 'Added reference to project',
      },
      { status: result.alreadyExisted ? 200 : 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add reference' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _projectId } = await params;
    const body = await request.json();
    const parsed = UpdateReferenceSchema.parse(body);

    const ok = updateSourceReference(parsed.id, {
      workflowStatus: parsed.workflowStatus as WorkflowStatus | undefined,
      notes: parsed.notes,
      commercialUseStatus: parsed.commercialUseStatus as CommercialUseStatus | undefined,
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Reference not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reference updated' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update reference' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _projectId } = await params;
    const { searchParams } = new URL(request.url);
    const refId = searchParams.get('refId');

    if (!refId) {
      return NextResponse.json({ success: false, error: 'refId query param is required' }, { status: 400 });
    }

    const deleted = deleteSourceReference(refId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Reference not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reference deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete reference' },
      { status: 500 }
    );
  }
}
