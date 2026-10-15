import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { listLocalMediaByProject, deleteLocalMedia } from '@/lib/database/db';
import { saveImportedMedia } from '@/lib/storage/media-manager';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = listLocalMediaByProject(id);
    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list media' },
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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const sourceReferenceId = (formData.get('sourceReferenceId') as string) || undefined;
    const notes = (formData.get('notes') as string) || undefined;
    const licenceSnapshot = (formData.get('licenceSnapshot') as string) || undefined;
    const attributionSnapshot = (formData.get('attributionSnapshot') as string) || undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const savedRecord = saveImportedMedia({
      projectId: id,
      sourceReferenceId,
      originalFilename: file.name,
      mimeType: file.type || 'application/octet-stream',
      buffer,
      licenceSnapshot,
      attributionSnapshot,
      notes,
    });

    return NextResponse.json({ success: true, media: savedRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import local media' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ success: false, error: 'mediaId parameter is required' }, { status: 400 });
    }

    const items = listLocalMediaByProject(projectId);
    const target = items.find((m) => m.id === mediaId);

    if (target) {
      // Clean up physical file safely
      try {
        const fullPath = path.join(process.cwd(), 'public', target.localRelativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Continue to delete db record even if file already gone
      }
    }

    const ok = deleteLocalMedia(mediaId);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Media removed' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete media' },
      { status: 500 }
    );
  }
}
