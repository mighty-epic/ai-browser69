// src/app/api/requests/admin/[id]/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

interface RequestContext {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RequestContext) {
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }

  try {
    const { status } = await req.json();

    if (!status || !['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be one of: approved, denied.' }, { status: 400 });
    }

    // First, fetch the request to check its current status and details
    const { data: existingRequest, error: fetchError } = await supabase
      .from('tool_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      console.error('Error fetching request or request not found:', fetchError);
      return NextResponse.json({ error: 'Request not found or error fetching it.' }, { status: 404 });
    }

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('tool_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If approved, and the tool doesn't already exist, add it to the main 'tools' table
    if (status === 'approved') {
      // Check if a tool with the same URL already exists to prevent duplicates
      const { data: existingTool, error: existingToolError } = await supabase
        .from('tools')
        .select('id')
        .eq('url', existingRequest.url)
        .maybeSingle(); // Use maybeSingle to not error if no tool is found

      if (existingToolError) {
        console.error('Error checking for existing tool:', existingToolError);
        // Proceed with caution or return an error. For now, let's log and proceed.
      }

      if (!existingTool) {
        const { data: newTool, error: toolInsertError } = await supabase
          .from('tools')
          .insert({
            name: existingRequest.name,
            description: existingRequest.description,
            url: existingRequest.url,
            // status: 'approved', // Tools table might have its own status or just be implicitly approved
            // user_id: existingRequest.user_id, // If you track who requested it
          })
          .select('id') // Ensure 'id' is selected for the new tool
          .single();

        if (toolInsertError) {
          console.error('Error inserting approved tool:', toolInsertError);
          // Potentially roll back the request status update or log for manual intervention
          return NextResponse.json({ error: `Request approved, but failed to add tool: ${toolInsertError.message}` }, { status: 500 });
        }

        // Handle tags: Assuming existingRequest.tags is an array of tag names
        // The 'tags' field in 'tool_requests' is likely a text array or comma-separated string.
        // Let's assume it's an array of strings based on RequestModal.tsx
        let requestTags: string[] = [];
        // Ensure existingRequest.tags is treated as an array of strings, as per schema TEXT[]
        if (Array.isArray(existingRequest.tags)) {
            requestTags = existingRequest.tags.map(t => String(t).trim()).filter(t => t);
        } else if (existingRequest.tags && typeof existingRequest.tags === 'string') {
            // This case handles if tags are stored as a string like "{tag1,tag2}" or "tag1,tag2"
            console.warn('Request tags format is string, attempting to parse:', existingRequest.tags);
            try {
                if (existingRequest.tags.startsWith('{') && existingRequest.tags.endsWith('}')) {
                    // Handles PostgreSQL array string format e.g., "{tagA,tagB}"
                    requestTags = existingRequest.tags.slice(1, -1).split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(t => t);
                } else {
                    // Handles simple comma-separated string without braces
                    requestTags = existingRequest.tags.split(',').map(t => t.trim()).filter(t => t);
                }
            } catch (parseError) {
                console.error('Failed to parse tags string:', parseError);
                // If parsing fails, requestTags remains empty, or handle as appropriate
            }
        } else if (existingRequest.tags) {
             console.warn('Request tags format unexpected and not a string or array:', existingRequest.tags);
        }

        if (newTool && newTool.id && requestTags.length > 0) {
          for (const tagName of requestTags) {
            let { data: tag, error: tagError } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .single();

            if (tagError && tagError.code !== 'PGRST116') { // PGRST116: single row not found
              console.error(`Error finding tag ${tagName}:`, tagError);
              continue; // Skip this tag
            }

            if (!tag) { // Tag doesn't exist, create it
              const { data: newTag, error: newTagError } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select('id')
                .single();
              if (newTagError) {
                console.error(`Error creating tag ${tagName}:`, newTagError);
                continue;
              }
              tag = newTag;
            }

            // Link tool to tag
            const { error: toolTagError } = await supabase
              .from('tool_tags')
              .insert({ tool_id: newTool.id, tag_id: tag.id });
            
            if (toolTagError) {
              // Handle potential duplicate errors if the link already exists, or other errors
              if (toolTagError.code === '23505') { // unique_violation
                console.warn(`Tool-tag link already exists for tool ${newTool.id} and tag ${tag.id}`);
              } else {
                console.error(`Error linking tool ${newTool.id} to tag ${tag.id}:`, toolTagError);
              }
            }
          }
        }
      } else {
        console.log(`Tool with URL ${existingRequest.url} already exists. Request approved, no new tool added.`);
      }
    }

    return NextResponse.json(updatedRequest, { status: 200 });

  } catch (err: any) {
    console.error('Unexpected error updating request status:', err);
    // Check if the error is a Supabase specific error and try to get more details
    if (err.code) {
        console.error('Supabase error code:', err.code, 'message:', err.message, 'details:', err.details);
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}