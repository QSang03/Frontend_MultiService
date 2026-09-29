import { NextRequest, NextResponse } from 'next/server';
import {
  protoCreateTicketTask,
  protoUpdateTicketTask,
  protoListTicketTasks,
  protoDeleteTicketTask,
} from '@/lib/proto/ticket-client';

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw =
    secondsField == null
      ? undefined
      : typeof secondsField === 'number' || typeof secondsField === 'string'
      ? secondsField
      : String(secondsField);
  if (secondsRaw == null) return undefined;
  const seconds = Number(secondsRaw);
  if (Number.isNaN(seconds)) return undefined;
  const nanos = Number((t.nanos as number | undefined) ?? 0);
  const ms = seconds * 1000 + Math.floor(nanos / 1e6);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

function mapTaskToDto(raw: unknown) {
  if (!raw) return null;
  const t = raw as Record<string, unknown>;
  return {
    id: String(t.id || ''),
    ticketId: String(t.ticketId || ''),
    title: String(t.title || ''),
    description: String(t.description || ''),
    assignedTechId: t.assignedTechId ? String(t.assignedTechId) : undefined,
    assignedTechName: t.assignedTechName ? String(t.assignedTechName) : undefined,
    estimatedMinutes: Number(t.estimatedMinutes || 0),
    actualMinutes: Number(t.actualMinutes || 0),
    effortRating: Number(t.effortRating || 0),
    leadRating: Number(t.leadRating || 0),
    status: String(t.status || 'PENDING'),
    startedAt: timestampToIso(t.startedAt),
    completedAt: timestampToIso(t.completedAt),
    createdAt: timestampToIso(t.createdAt),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const result = await protoListTicketTasks(ticketId);
    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to list tasks' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    const rawTasks = (resp.tasks as unknown[]) || [];
    const tasks = rawTasks.map(mapTaskToDto);

    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const result = await protoCreateTicketTask({
      ticketId,
      title: body.title,
      description: body.description || '',
      assignedTechId: body.assignedTechId,
      estimatedMinutes: Number(body.estimatedMinutes || 30),
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to create task' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      task: mapTaskToDto(resp.task),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Ensure params are resolved
    const body = await request.json();

    if (!body.taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const result = await protoUpdateTicketTask({
      taskId: body.taskId,
      title: body.title,
      description: body.description,
      assignedTechId: body.assignedTechId,
      estimatedMinutes: body.estimatedMinutes != null ? Number(body.estimatedMinutes) : undefined,
      actualMinutes: body.actualMinutes != null ? Number(body.actualMinutes) : undefined,
      effortRating: body.effortRating != null ? Number(body.effortRating) : undefined,
      leadRating: body.leadRating != null ? Number(body.leadRating) : undefined,
      status: body.status,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Failed to update task' }, { status: 500 });
    }

    const resp = result.response as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      task: mapTaskToDto(resp.task),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId query parameter is required' }, { status: 400 });
    }

    const result = await protoDeleteTicketTask(taskId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
