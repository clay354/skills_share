import { NextResponse } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';
import { Plugin } from '@/data/plugins';

// Get all plugins from Redis
async function getAllPlugins(): Promise<Plugin[]> {
  try {
    return await redis.get<Plugin[]>(REDIS_KEYS.plugins) || [];
  } catch {
    return [];
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

  // Return list with update info
  const list = plugins.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    marketplace: p.marketplace,
    installCommand: p.installCommand,
    features: p.features,
    agents: p.agents,
    skills: p.skills,
    examples: p.examples,
    updatedAt: p.updatedAt,
    updatedBy: p.updatedBy,
  }));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  try {
    const newPlugin = await request.json() as Partial<Plugin> & { authorName?: string };

    // Validate required fields
    if (!newPlugin.id || !newPlugin.name || !newPlugin.marketplace) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, marketplace' },
        { status: 400 }
      );
    }

    if (!newPlugin.authorName) {
      return NextResponse.json(
        { error: 'Missing required field: authorName' },
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
      updatedAt: new Date().toISOString(),
      updatedBy: newPlugin.authorName,
    };

    // Add new plugin
    const updatedPlugins = [...existingPlugins, plugin];

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
    const updateData = await request.json() as Partial<Plugin> & { authorName?: string };

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

    // Get current plugins
    const plugins = await getAllPlugins();
    const existingIndex = plugins.findIndex(p => p.id === updateData.id);

    if (existingIndex === -1) {
      return NextResponse.json(
        { error: `Plugin with id "${updateData.id}" not found` },
        { status: 404 }
      );
    }

    // Merge with existing plugin
    const existingPlugin = plugins[existingIndex];
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
      updatedAt: new Date().toISOString(),
      updatedBy: updateData.authorName,
    };

    // Replace in array
    plugins[existingIndex] = updatedPlugin;

    // Update Redis
    await redis.set(REDIS_KEYS.plugins, plugins);

    return NextResponse.json({ success: true, id: updatedPlugin.id, message: 'Plugin updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: `Update failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
