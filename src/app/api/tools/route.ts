// src/app/api/tools/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Zod schema for validating new tool creation
const createToolSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(100, 'Name too long'),
  url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  description: z.string().min(10, 'Description must be at least 10 characters long').max(1000, 'Description too long'),
  tags: z.array(z.string().min(1, 'Tag too short').max(50, 'Tag too long')).optional().default([]),
  is_approved: z.boolean().default(true), // Admin created tools are approved by default
  // category_id: z.string().uuid({ message: "Invalid category ID" }).optional(),
  // icon_url: z.string().url({ message: "Invalid icon URL" }).optional(),
});

// Zod schema for validating tool updates
const updateToolSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  url: z.string().url().max(2048).optional(),
  description: z.string().min(10).max(1000).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  is_approved: z.boolean().optional(),
  // category_id: z.string().uuid().optional(),
  // icon_url: z.string().url().optional(),
}).strict(); // Ensures no extra properties are passed

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchTerm = searchParams.get('q')?.trim() || '';
    const tagFilter = searchParams.get('tag')?.trim() || '';
    const approvedParam = searchParams.get('approved');

    if (isNaN(page) || page < 1) return NextResponse.json({ error: 'Invalid page number.'}, { status: 400 });
    if (isNaN(limit) || limit < 1 || limit > 100) return NextResponse.json({ error: 'Invalid limit value (must be 1-100).'}, { status: 400 });

    const offset = (page - 1) * limit;

    let query = supabase
      .from('tools')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (searchTerm) {
      // Using textSearch for potentially better performance on larger datasets if tsvector is set up
      // query = query.textSearch('fts', searchTerm); // Assuming 'fts' is your tsvector column
      // Fallback to ILIKE if textSearch is not configured or preferred for simplicity here
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    if (tagFilter) {
      query = query.contains('tags', [tagFilter]);
    }

    if (approvedParam === 'true') {
      query = query.is('is_approved', true);
    } else if (approvedParam === 'false') {
      query = query.is('is_approved', false);
    } // If approvedParam is not 'true' or 'false', no filter is applied for approval status

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase GET error in /api/tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools from database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('API GET Error in /api/tools:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching tools.', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createToolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input for creating tool.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, url, description, tags, is_approved } = validation.data;

    const { data, error } = await supabase
      .from('tools')
      .insert([
        {
          name,
          url,
          description,
          tags: tags && tags.length > 0 ? tags : null,
          is_approved,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST error in /api/tools:', error);
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'A tool with this name or URL might already exist.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create tool in database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tool created successfully!', data }, { status: 201 });
  } catch (err: any) {
    console.error('API POST Error in /api/tools:', err);
    if (err.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON payload provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while creating the tool.', details: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('id');

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required in query parameters for update.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateToolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input for updating tool.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData = validation.data;
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }

    // Handle tags: if an empty array is passed, it means clear tags. If undefined, don't update tags.
    if (updateData.tags === null || (Array.isArray(updateData.tags) && updateData.tags.length === 0)) {
      updateData.tags = null as any; // Supabase expects null for empty array or to clear it
    } else if (updateData.tags === undefined) {
      delete updateData.tags; // Don't send tags field if not provided
    }

    const { data, error } = await supabase
      .from('tools')
      .update(updateData)
      .eq('id', toolId)
      .select()
      .single();

    if (error) {
      console.error('Supabase PUT error in /api/tools:', error);
      if (error.code === 'PGRST204') { // No rows found for update
        return NextResponse.json({ error: 'Tool not found with the provided ID.' }, { status: 404 });
      }
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'Update failed due to a conflict (e.g., name or URL already exists for another tool).' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update tool in database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tool updated successfully!', data }, { status: 200 });
  } catch (err: any) {
    console.error('API PUT Error in /api/tools:', err);
    if (err.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON payload provided for update.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while updating the tool.', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('id');

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required in query parameters for deletion.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId);

    if (error) {
      console.error('Supabase DELETE error in /api/tools:', error);
      if (error.code === 'PGRST204') { // No rows found for delete
        return NextResponse.json({ error: 'Tool not found with the provided ID.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete tool from database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tool deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('API DELETE Error in /api/tools:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while deleting the tool.', details: err.message }, { status: 500 });
  }
}