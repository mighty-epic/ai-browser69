// src/app/api/tools/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Request as ToolRequest } from '@/types'; // Renamed to avoid conflict with NextRequest

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, description, tags } = body as {
      name: string;
      url: string;
      description?: string;
      tags?: string; // Expecting comma-separated string of tag names
    };

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required for a tool request' }, { status: 400 });
    }

    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        name,
        url,
        description,
        tags, // Store as is, admin will process/validate tags
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tool request:', error);
      throw error;
    }

    // TODO: Implement notification for admin (e.g., email, dashboard badge)
    // This could be a Supabase Edge Function triggered on new row in 'requests' table
    // or a separate mechanism.

    return NextResponse.json(newRequest, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/tools/request:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit tool request' }, { status: 500 });
  }
}