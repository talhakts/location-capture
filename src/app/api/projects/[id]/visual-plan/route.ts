import { NextResponse } from 'next/server';
import {
  getProject,
  getVisualPlanByProject,
  createOrUpdateVisualPlan,
  listScriptScenesByPlan,
  saveScriptScenes,
  listSceneCandidatesByProject
} from '@/lib/database/db';
import { VisualPlanParser } from '@/lib/script-parser/parser';
import { VisualPlan } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const plan = getVisualPlanByProject(projectId);
    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        scenes: [],
        candidates: [],
      });
    }

    const scenes = listScriptScenesByPlan(plan.id);
    const candidates = listSceneCandidatesByProject(projectId);

    return NextResponse.json({
      success: true,
      plan,
      scenes,
      candidates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch visual plan' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const rawInput = body.rawText || body.rawInput;

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText content is required' },
        { status: 400 }
      );
    }

    const planId = `plan_${projectId}_${Date.now()}`;
    const parsed = VisualPlanParser.parse(rawInput, projectId, planId);

    const now = new Date().toISOString();
    const visualPlan: VisualPlan = {
      id: planId,
      projectId,
      title: body.title || `${project.title} - Visual Plan`,
      rawInput,
      sceneCount: parsed.scenes.length,
      createdAt: now,
      updatedAt: now,
    };

    createOrUpdateVisualPlan(visualPlan);
    saveScriptScenes(parsed.scenes);

    return NextResponse.json({
      success: true,
      plan: visualPlan,
      scenes: parsed.scenes,
      warningCount: parsed.warningCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to parse visual plan' },
      { status: 500 }
    );
  }
}
