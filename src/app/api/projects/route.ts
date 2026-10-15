import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listProjects, createProject, listReferencesByProject, listShotPlansByProject } from '@/lib/database/db';

const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(120),
  workingVideoTitle: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  scriptExcerpt: z.string().max(5000).optional(),
});

export async function GET() {
  try {
    const projects = listProjects();
    const enriched = projects.map((p) => {
      const refs = listReferencesByProject(p.id);
      const shots = listShotPlansByProject(p.id);
      return {
        ...p,
        referenceCount: refs.length,
        shotCount: shots.length,
      };
    });

    return NextResponse.json({ success: true, projects: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateProjectSchema.parse(body);

    const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newProject = createProject({
      id,
      title: parsed.title,
      workingVideoTitle: parsed.workingVideoTitle,
      description: parsed.description,
      scriptExcerpt: parsed.scriptExcerpt,
    });

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
