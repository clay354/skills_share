import { NextResponse } from 'next/server';
import { commands } from '@/data/commands';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');

  // Get specific command by ID
  if (id) {
    const command = commands.find(c => c.id === id);
    if (!command) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }
    return NextResponse.json(command);
  }

  // Filter by category
  let filtered = commands;
  if (category) {
    filtered = commands.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  // Return list (without content for smaller payload)
  const list = filtered.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    installPath: c.installPath,
    examples: c.examples,
  }));

  return NextResponse.json(list);
}
