import { NextResponse } from 'next/server';
import {
  getProject,
  listReferencesByProject,
  listShotPlansByProject,
  listLocalMediaByProject,
} from '@/lib/database/db';
import { ExportManager } from '@/lib/exports/export-manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = getProject(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const references = listReferencesByProject(id);
    const shotPlans = listShotPlansByProject(id);
    const localMedia = listLocalMediaByProject(id);

    const safeSlug = (project.title || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);

    if (format === 'csv') {
      const csv = ExportManager.generateReferencesCsv(references);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeSlug}_references.csv"`,
        },
      });
    }

    if (format === 'attribution') {
      const md = ExportManager.generateAttributionReport(project, references);
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeSlug}_attribution-report.md"`,
        },
      });
    }

    if (format === 'shotlist') {
      const md = ExportManager.generateShotList(project, shotPlans, references);
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeSlug}_shot-list.md"`,
        },
      });
    }

    // Default: json
    const jsonStr = ExportManager.generateJsonManifest(project, references, shotPlans, localMedia);
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeSlug}_project.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
