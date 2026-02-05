import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { plugins as builtInPlugins, Plugin } from '@/data/plugins';

// Get all plugins (built-in + uploaded)
async function getAllPlugins(): Promise<Plugin[]> {
  try {
    const uploadedPlugins = await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
    return [...builtInPlugins, ...uploadedPlugins];
  } catch {
    // Redis not configured, return only built-in
    return builtInPlugins;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const plugins = await getAllPlugins();

  // Get specific plugin by ID
  if (id) {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
    }
    return NextResponse.json(plugin);
  }

  return NextResponse.json(plugins);
}

export async function POST(request: Request) {
  try {
    const newPlugin = await request.json() as Partial<Plugin>;

    // Validate required fields
    if (!newPlugin.id || !newPlugin.name || !newPlugin.marketplace) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, marketplace' },
        { status: 400 }
      );
    }

    // Check for duplicate ID
    const existingPlugins = await getAllPlugins();
    if (existingPlugins.some(p => p.id === newPlugin.id)) {
      return NextResponse.json(
        { error: `Plugin with id "${newPlugin.id}" already exists` },
        { status: 409 }
      );
    }

    // Build complete plugin object
    const plugin: Plugin = {
      id: newPlugin.id,
      name: newPlugin.name,
      description: newPlugin.description || '',
      category: newPlugin.category || 'Other',
      marketplace: newPlugin.marketplace,
      installCommand: newPlugin.installCommand || `/install-plugin ${newPlugin.id}@${newPlugin.marketplace}`,
      features: newPlugin.features || [],
      agents: newPlugin.agents || [],
      skills: newPlugin.skills || [],
      examples: newPlugin.examples || [],
    };

    // Get current uploaded plugins
    let uploadedPlugins: Plugin[] = [];
    try {
      uploadedPlugins = await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
    } catch {
      uploadedPlugins = [];
    }

    // Add new plugin
    const updatedPlugins = [...uploadedPlugins, plugin];

    // Update Redis
    await redis.set(REDIS_KEYS.plugins, updatedPlugins);

    return NextResponse.json({ success: true, id: plugin.id, message: 'Plugin uploaded successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const updateData = await request.json() as Partial<Plugin>;

    // Validate required field
    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Check if plugin exists in uploaded plugins (can't update built-in)
    let uploadedPlugins: Plugin[] = [];
    try {
      uploadedPlugins = await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
    } catch {
      uploadedPlugins = [];
    }

    const existingIndex = uploadedPlugins.findIndex(p => p.id === updateData.id);

    // Check if it's a built-in plugin
    if (builtInPlugins.some(p => p.id === updateData.id)) {
      return NextResponse.json(
        { error: `Cannot update built-in plugin "${updateData.id}"` },
        { status: 403 }
      );
    }

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `Plugin with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    // Merge with existing plugin
    const existingPlugin = uploadedPlugins[existingIndex];
    const updatedPlugin: Plugin = {
      ...existingPlugin,
      name: updateData.name || existingPlugin.name,
      description: updateData.description ?? existingPlugin.description,
      category: updateData.category || existingPlugin.category,
      marketplace: updateData.marketplace || existingPlugin.marketplace,
      installCommand: updateData.installCommand || existingPlugin.installCommand,
      features: updateData.features || existingPlugin.features,
      agents: updateData.agents || existingPlugin.agents,
      skills: updateData.skills || existingPlugin.skills,
      examples: updateData.examples || existingPlugin.examples,
    };

    // Replace in array
    uploadedPlugins[existingIndex] = updatedPlugin;

    // Update Redis
    await redis.set(REDIS_KEYS.plugins, uploadedPlugins);

    return NextResponse.json({ success: true, id: updatedPlugin.id, message: 'Plugin updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
