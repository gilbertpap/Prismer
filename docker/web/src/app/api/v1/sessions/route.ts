import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { API_BASE_URL, CONTAINER_API_TOKEN } from '@/lib/config';

// In-memory session store for development
const devSessions: Map<string, { id: string; created_at: string; last_active_at: string; message_count: number }> = new Map();

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      headers: {
        ...(CONTAINER_API_TOKEN && { Authorization: `Bearer ${CONTAINER_API_TOKEN}` }),
      },
    });

    if (response.ok) {
      const data = await response.json();
      return Response.json(data);
    }

    // Fall back to dev sessions
    return Response.json({
      sessions: Array.from(devSessions.values()),
    });
  } catch (error) {
    // Return dev sessions when gateway not available
    return Response.json({
      sessions: Array.from(devSessions.values()),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONTAINER_API_TOKEN && { Authorization: `Bearer ${CONTAINER_API_TOKEN}` }),
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return Response.json(data);
    }

    // Create dev session when gateway not available
    const sessionId = body.id || `session-${nanoid(10)}`;
    const session = {
      id: sessionId,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      message_count: 0,
    };
    devSessions.set(sessionId, session);

    return Response.json(session);
  } catch (error) {
    // Create dev session
    const sessionId = `session-${nanoid(10)}`;
    const session = {
      id: sessionId,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      message_count: 0,
    };
    devSessions.set(sessionId, session);

    return Response.json(session);
  }
}
