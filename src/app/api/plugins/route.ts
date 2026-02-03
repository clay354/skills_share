import { NextResponse } from 'next/server';
import { plugins } from '@/data/plugins';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

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
