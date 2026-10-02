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

interface TicketTaskDto {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  assignedTechId?: string;
  assignedTechName?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  effortRating: number;
  leadRating: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

function mapTaskToDto(raw: unknown): TicketTaskDto | null {
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

// Fallback in-memory store if remote backend server has not yet deployed ticket task RPCs
const fallbackTaskStore: Map<string, TicketTaskDto[]> = new Map();

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
    if (result.success && result.response) {
      const resp = result.response as Record<string, unknown>;
      const rawTasks = (resp.tasks as unknown[]) || [];
      const tasks = rawTasks.map(mapTaskToDto);
      return NextResponse.json({ tasks });
    }

    // Fallback store
    const tasks = fallbackTaskStore.get(ticketId) || [];
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

    if (result.success && result.response) {
      const resp = result.response as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        task: mapTaskToDto(resp.task),
      });
    }

    // Fallback create
    const newTask: TicketTaskDto = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticketId,
      title: body.title,
      description: body.description || '',
      assignedTechId: body.assignedTechId,
      estimatedMinutes: Number(body.estimatedMinutes || 30),
      actualMinutes: 0,
      effortRating: 3,
      leadRating: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    const list = fallbackTaskStore.get(ticketId) || [];
    list.push(newTask);
    fallbackTaskStore.set(ticketId, list);

    return NextResponse.json({
      success: true,
      task: newTask,
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
    const { id: ticketId } = await params;
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

    if (result.success && result.response) {
      const resp = result.response as Record<string, unknown>;
      return NextResponse.json({
        success: true,
        task: mapTaskToDto(resp.task),
      });
    }

    // Fallback update
    const list = fallbackTaskStore.get(ticketId) || [];
    const idx = list.findIndex((t) => t.id === body.taskId);
    if (idx !== -1) {
      const updated: TicketTaskDto = {
        ...list[idx],
        title: body.title ?? list[idx].title,
        description: body.description ?? list[idx].description,
        assignedTechId: body.assignedTechId ?? list[idx].assignedTechId,
        estimatedMinutes: body.estimatedMinutes != null ? Number(body.estimatedMinutes) : list[idx].estimatedMinutes,
        actualMinutes: body.actualMinutes != null ? Number(body.actualMinutes) : list[idx].actualMinutes,
        effortRating: body.effortRating != null ? Number(body.effortRating) : list[idx].effortRating,
        leadRating: body.leadRating != null ? Number(body.leadRating) : list[idx].leadRating,
        status: body.status ?? list[idx].status,
        completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : list[idx].completedAt,
      };
      list[idx] = updated;
      fallbackTaskStore.set(ticketId, list);
      return NextResponse.json({
        success: true,
        task: updated,
      });
    }

    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
    const { id: ticketId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId query parameter is required' }, { status: 400 });
    }

    const result = await protoDeleteTicketTask(taskId);
    if (result.success) {
      return NextResponse.json({ success: true });
    }

    // Fallback delete
    const list = fallbackTaskStore.get(ticketId) || [];
    const filtered = list.filter((t) => t.id !== taskId);
    fallbackTaskStore.set(ticketId, filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
