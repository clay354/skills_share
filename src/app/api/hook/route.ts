import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { Hook } from '@/data/hooks';
import { getKoreanTimeISO } from '@/lib/utils';

// Get all hooks from Redis
async function getAllHooks(): Promise<Hook[]> {
  try {
    return await redis.get<Hook[]>(REDIS_KEYS.hooks) || [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const event = searchParams.get('event');

  const hooks = await getAllHooks();

  // Get specific hook by ID
  if (id) {
    const hook = hooks.find(h => h.id === id);
    if (!hook) {
      return NextResponse.json({ error: 'Hook not found' }, { status: 404 });
    }
    return NextResponse.json(hook);
  }

  // Filter
  let filtered = hooks;
  if (category) {
    filtered = filtered.filter(h => h.category.toLowerCase() === category.toLowerCase());
  }
  if (event) {
    filtered = filtered.filter(h => h.event === event);
  }

  // Return list
  const list = filtered.map(h => ({
    id: h.id,
    name: h.name,
    description: h.description,
    category: h.category,
    event: h.event,
    matcher: h.matcher,
    examples: h.examples,
    updatedAt: h.updatedAt,
    updatedBy: h.updatedBy,
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const newHook = await request.json() as Partial<Hook> & { authorName?: string };

    // Validate required fields
    if (!newHook.id || !newHook.name || !newHook.event || !newHook.command) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, event, command' },
        { status: 400 }
      );
    }

    if (!newHook.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
        { status: 400 }
      );
    }

    // Check for duplicate ID
    const existingHooks = await getAllHooks();
    if (existingHooks.some(h => h.id === newHook.id)) {
      return NextResponse.json(
        { error: `Hook with id "${newHook.id}" already exists` },
        { status: 409 }
      );
    }

    // Build complete hook object
    const now = getKoreanTimeISO();
    const hook: Hook = {
      id: newHook.id,
      name: newHook.name,
      description: newHook.description || '',
      category: newHook.category || 'Other',
      event: newHook.event,
      matcher: newHook.matcher,
      command: newHook.command,
      scriptContent: newHook.scriptContent,
      scriptPath: newHook.scriptPath,
      timeout: newHook.timeout,
      examples: newHook.examples || [],
      createdAt: now,
      updatedAt: now,
      updatedBy: newHook.authorName,
    };

    // Add new hook
    const updatedHooks = [...existingHooks, hook];

    // Update Redis
    await redis.set(REDIS_KEYS.hooks, updatedHooks);

    return NextResponse.json({ success: true, id: hook.id, message: 'Hook uploaded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updateData = await request.json() as Partial<Hook> & { authorName?: string };

    // Validate required fields
    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    if (!updateData.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
        { status: 400 }
      );
    }

    // Get current hooks
    const hooks = await getAllHooks();
    const existingIndex = hooks.findIndex(h => h.id === updateData.id);

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `Hook with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    const existingHook = hooks[existingIndex];
    const now = getKoreanTimeISO();

    // Merge with existing hook
    const updatedHook: Hook = {
      ...existingHook,
      name: updateData.name || existingHook.name,
      description: updateData.description ?? existingHook.description,
      category: updateData.category || existingHook.category,
      event: updateData.event || existingHook.event,
      matcher: updateData.matcher ?? existingHook.matcher,
      command: updateData.command || existingHook.command,
      scriptContent: updateData.scriptContent ?? existingHook.scriptContent,
      scriptPath: updateData.scriptPath ?? existingHook.scriptPath,
      timeout: updateData.timeout ?? existingHook.timeout,
      examples: updateData.examples || existingHook.examples,
      updatedAt: now,
      updatedBy: updateData.authorName,
    };

    // Replace in array
    hooks[existingIndex] = updatedHook;

    // Update Redis
    await redis.set(REDIS_KEYS.hooks, hooks);

    return NextResponse.json({
      success: true,
      id: updatedHook.id,
      message: 'Hook updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
