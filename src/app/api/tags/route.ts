// src/app/api/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { z } from 'zod';

const supabase = createClient();

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name cannot be empty').max(50, 'Tag name too long'),
  description: z.string().optional(),
});

// GET /api/tags - Fetch all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchTerm = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = supabase.from('tags').select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    query = query.range(offset, offset + limit - 1).order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization (admin only)
    const body = await request.json();
    const validation = tagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const { name, description } = validation.data;

    // Check if tag already exists (case-insensitive)
    const { data: existingTag, error: fetchError } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', name)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row not found, which is fine here
        console.error('Error checking for existing tag:', fetchError);
        return NextResponse.json({ error: 'Failed to check for existing tag' }, { status: 500 });
    }

    if (existingTag) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, description }])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tag created successfully', data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/tags - Update an existing tag
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization (admin only)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = tagSchema.partial().safeParse(body); // Partial for updates

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const { name, description } = validation.data;

    if (!name && description === undefined) {
        return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    // If name is being updated, check for conflicts (excluding the current tag)
    if (name) {
        const { data: conflictingTag, error: fetchError } = await supabase
            .from('tags')
            .select('id')
            .ilike('name', name)
            .not('id', 'eq', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking for conflicting tag name:', fetchError);
            return NextResponse.json({ error: 'Failed to check for conflicting tag name' }, { status: 500 });
        }
        if (conflictingTag) {
            return NextResponse.json({ error: 'Another tag with this name already exists' }, { status: 409 });
        }
    }

    const updateData: { name?: string; description?: string | null } = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description; // Allow setting description to null or empty

    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      if (error.code === 'PGRST116') { // Row not found
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tag updated successfully', data });
  } catch (error) {
    console.error('Error in PUT /api/tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/tags - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization (admin only)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Optional: Check if the tag is associated with any tools before deleting
    // This might involve querying a join table like 'tool_tags'
    // For simplicity, this step is omitted here.

    const { error } = await supabase.from('tags').delete().eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      if (error.code === 'PGRST116') { // Row not found, or RLS preventing delete
        return NextResponse.json({ error: 'Tag not found or could not be deleted' }, { status: 404 });
      }
      // Handle foreign key constraint violation (e.g., if tag is still in use)
      if (error.code === '23503') { // foreign_key_violation
        return NextResponse.json({ error: 'Tag cannot be deleted as it is currently associated with one or more tools.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}