import { NextRequest } from 'next/server';
import { API_BASE_URL, CONTAINER_API_TOKEN } from '@/lib/config';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${id}`, {
      headers: {
        ...(CONTAINER_API_TOKEN && { Authorization: `Bearer ${CONTAINER_API_TOKEN}` }),
      },
    });

    if (response.ok) {
      const data = await response.json();
      return Response.json(data);
    }

    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Session not found' } },
      { status: 404 }
    );
  } catch (error) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Session not found' } },
      { status: 404 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${id}`, {
      method: 'DELETE',
      headers: {
        ...(CONTAINER_API_TOKEN && { Authorization: `Bearer ${CONTAINER_API_TOKEN}` }),
      },
    });

    if (response.ok) {
      return Response.json({ success: true });
    }

    // For dev mode, just return success
    return Response.json({ success: true });
  } catch (error) {
    // For dev mode, just return success
    return Response.json({ success: true });
  }
}
