// src/app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

// Zod schema for validating new tool request submissions
const toolRequestSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(100, 'Name must be at most 100 characters long'),
  url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
  description: z.string().min(10, 'Description must be at least 10 characters long').max(1000, 'Description must be at most 1000 characters long'),
  tags: z.array(z.string().min(1).max(50)).optional().default([]), // Optional array of strings for tags
  // category_id: z.string().uuid().optional(), // Example: if you have categories
  // submitted_by_email: z.string().email().optional(), // If you want to track who submitted
});

// Zod schema for validating tool request updates (status, admin_notes)
const updateToolRequestSchema = z.object({
  status: z.enum(['pending', 'processed', 'rejected'], { errorMap: () => ({ message: "Invalid status. Must be 'pending', 'processed', or 'rejected'."}) }),
  admin_notes: z.string().max(1000, 'Admin notes must be at most 1000 characters long').optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') as 'pending' | 'processed' | 'rejected' | undefined;

    if (isNaN(page) || page < 1) return NextResponse.json({ error: 'Invalid page number.'}, { status: 400 });
    if (isNaN(limit) || limit < 1 || limit > 100) return NextResponse.json({ error: 'Invalid limit value (must be 1-100).'}, { status: 400 });

    const offset = (page - 1) * limit;

    let query = supabase
      .from('tool_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'processed', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase GET error in /api/requests:', error);
      return NextResponse.json({ error: 'Failed to fetch tool requests from database.', details: error.message }, { status: 500 });
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
    console.error('API GET Error in /api/requests:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching tool requests.', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = toolRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, url, description, tags } = validation.data;

    const { data, error } = await supabase
      .from('tool_requests')
      .insert([
        {
          name,
          url,
          description,
          tags: tags && tags.length > 0 ? tags : null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST error in /api/requests:', error);
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'A tool with this name or URL might already be requested or exist.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to submit tool request to database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tool request submitted successfully!', data }, { status: 201 });
  } catch (err: any) {
    console.error('API POST Error in /api/requests:', err);
    if (err.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON payload provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while submitting the tool request.', details: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'Tool Request ID is required in query parameters.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateToolRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input for update.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, admin_notes } = validation.data;

    const updateData: { status: string; admin_notes?: string | null; processed_at?: string } = { status };
    updateData.admin_notes = admin_notes ?? null; // Set to null if undefined
    
    if (status === 'processed' || status === 'rejected') {
      updateData.processed_at = new Date().toISOString();
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('tool_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase PUT error in /api/requests:', updateError);
      if (updateError.code === 'PGRST204') { // No rows found for update
        return NextResponse.json({ error: 'Tool request not found with the provided ID.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update tool request in database.', details: updateError.message }, { status: 500 });
    }

    // If a request is 'processed' (approved), add it to the main 'tools' table
    if (status === 'processed' && updatedRequest) {
      const { error: toolInsertError } = await supabase.from('tools').insert([{
        name: updatedRequest.name,
        url: updatedRequest.url,
        description: updatedRequest.description,
        tags: updatedRequest.tags,
        // category_id: updatedRequest.category_id, // if applicable
        is_approved: true, // Mark as approved
        // approved_by_user_id: 'admin_user_id', // TODO: Get actual admin user ID if auth is integrated
        // source_request_id: updatedRequest.id, // Link back to the original request
      }]);

      if (toolInsertError) {
        console.error('Error auto-adding tool to tools table after request approval:', toolInsertError);
        // This is a secondary action; the request update itself was successful.
        // Log this error and potentially alert admins, but don't fail the PUT response for this.
        return NextResponse.json({
          message: 'Tool request updated successfully, but failed to auto-add to tools list. Please add manually.',
          data: updatedRequest,
          warning: 'Failed to auto-add to tools list: ' + toolInsertError.message
        }, { status: 200 });
      }
    }

    return NextResponse.json({ message: 'Tool request updated successfully!', data: updatedRequest }, { status: 200 });
  } catch (err: any) {
    console.error('API PUT Error in /api/requests:', err);
    if (err.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid JSON payload provided for update.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while updating the tool request.', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'Tool Request ID is required in query parameters for deletion.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tool_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Supabase DELETE error in /api/requests:', error);
      if (error.code === 'PGRST204') { // No rows found for delete
        return NextResponse.json({ error: 'Tool request not found with the provided ID.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete tool request from database.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tool request deleted successfully.' }, { status: 200 }); // Or 204 No Content
  } catch (err: any) {
    console.error('API DELETE Error in /api/requests:', err);
    return NextResponse.json({ error: 'An unexpected error occurred while deleting the tool request.', details: err.message }, { status: 500 });
  }
}