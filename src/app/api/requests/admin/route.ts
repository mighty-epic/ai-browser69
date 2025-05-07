// src/app/api/requests/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Request as ToolRequest } from '@/types'; // Corrected: Imported 'Request' and aliased as 'ToolRequest'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// GET /api/requests/admin - Fetch all requests (admin only)
export async function GET(request: NextRequest) {
  const cookieStore = await cookies(); // Added await here
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Use the object-based signature for cookieStore.set
            // This aligns with common Supabase SSR examples for Next.js Route Handlers
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Errors can be ignored if middleware handles session refresh
            // console.error('Error setting cookie in Route Handler:', name, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Use the object-based signature for cookieStore.set with an empty value
            // This aligns with common Supabase SSR examples for Next.js Route Handlers
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Errors can be ignored if middleware handles session refresh
            // console.error('Error removing cookie in Route Handler:', name, error);
          }
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // Optional filter by status
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('tool_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ 
        requests: requests as ToolRequest[], 
        totalCount: count || 0,
        page,
        limit
    });

  } catch (error: any) {
    let errorMessage = 'Failed to fetch tool requests from database'; // Matched user's reported error message for consistency
    if (error && typeof error === 'object' && 'message' in error && error.message) {
      errorMessage = String(error.message);
    } else if (error) {
      // If no message, stringify the error for more details, helping debug
      errorMessage = `Failed to fetch requests. Supabase error: ${JSON.stringify(error)}`;
    }
    console.error('Error in GET /api/requests/admin:', error); // Keep detailed server log
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}