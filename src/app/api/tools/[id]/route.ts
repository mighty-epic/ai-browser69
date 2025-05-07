// src/app/api/tools/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Tag } from '@/types';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const toolId = params.id;
  if (!toolId) {
    return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, url, tags: tagNames } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const { data, error } = await supabase.tx(async (tx) => {
      // Update the tool details
      const { data: updatedTool, error: toolUpdateError } = await tx
        .from('tools')
        .update({ name, description, url, updated_at: new Date().toISOString() })
        .eq('id', toolId)
        .select()
        .single();

      if (toolUpdateError) {
        console.error('Error updating tool:', toolUpdateError);
        if (toolUpdateError.code === 'PGRST204') { // No rows found
            throw new Error('Tool not found.');
        }
        throw toolUpdateError;
      }
      if (!updatedTool) throw new Error('Tool not found after update attempt.');

      let finalTags: Tag[] = [];
      if (Array.isArray(tagNames)) { // Only process tags if provided and is an array
        // Delete existing tag associations for this tool
        const { error: deleteTagsError } = await tx
          .from('tool_tags')
          .delete()
          .eq('tool_id', toolId);

        if (deleteTagsError) {
          console.error('Error deleting old tool_tags:', deleteTagsError);
          throw deleteTagsError;
        }

        if (tagNames.length > 0) {
          // Find existing tags or create new ones
          const existingTagsResponse = await tx
            .from('tags')
            .select('id, name, created_at')
            .in('name', tagNames);

          if (existingTagsResponse.error) {
            console.error('Error fetching existing tags for update:', existingTagsResponse.error);
            throw existingTagsResponse.error;
          }

          const existingTagsMap = new Map(existingTagsResponse.data?.map(t => [t.name, t]));
          const newTagNamesToCreate = tagNames.filter(tn => !existingTagsMap.has(tn));

          if (newTagNamesToCreate.length > 0) {
            const { data: newTagsData, error: newTagsError } = await tx
              .from('tags')
              .insert(newTagNamesToCreate.map(name => ({ name })))
              .select('id, name, created_at');

            if (newTagsError) {
              console.error('Error inserting new tags for update:', newTagsError);
              throw newTagsError;
            }
            if (newTagsData) {
              newTagsData.forEach(nt => existingTagsMap.set(nt.name, nt));
            }
          }

          const toolTagEntries = tagNames
            .map(tagName => {
                const tag = existingTagsMap.get(tagName);
                return tag ? { tool_id: toolId, tag_id: tag.id } : null;
            })
            .filter(entry => entry !== null) as { tool_id: string; tag_id: string }[];

          if (toolTagEntries.length > 0) {
            const { error: toolTagsInsertError } = await tx
              .from('tool_tags')
              .insert(toolTagEntries);

            if (toolTagsInsertError) {
              console.error('Error inserting new tool_tags for update:', toolTagsInsertError);
              throw toolTagsInsertError;
            }
          }
          finalTags = tagNames.map(name => existingTagsMap.get(name)!).filter(Boolean);
        }
      } else {
        // If tags are not provided in the update, fetch current tags to return
        const { data: currentToolTags, error: currentTagsError } = await tx
            .from('tool_tags')
            .select('tags (id, name, created_at)')
            .eq('tool_id', toolId);
        if (currentTagsError) {
            console.error('Error fetching current tags for tool:', currentTagsError);
            // Non-fatal, proceed without tags if this fails
        } else if (currentToolTags) {
            finalTags = currentToolTags.map((ct: any) => ct.tags as Tag);
        }
      }
      return { ...updatedTool, tags: finalTags };
    });

    if (error) {
      console.error('Transaction failed for PUT /api/tools/[id]:', error);
      if (error.message.includes('Tool not found')) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }
      if (error.message.includes('duplicate key value violates unique constraint "tools_url_key"')) {
        return NextResponse.json({ error: 'A tool with this URL already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update tool. ' + error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error in PUT /api/tools/[id]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const toolId = params.id;
  if (!toolId) {
    return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
  }

  try {
    // Supabase cascade delete should handle tool_tags entries.
    // If not, delete from tool_tags first: await supabase.from('tool_tags').delete().eq('tool_id', toolId);
    const { error, count } = await supabase
      .from('tools')
      .delete({ count: 'exact' })
      .eq('id', toolId);

    if (error) {
      console.error('Error deleting tool:', error);
      throw error;
    }
    
    if (count === 0) {
        return NextResponse.json({ error: 'Tool not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tool deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error('Error in DELETE /api/tools/[id]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete tool' }, { status: 500 });
  }
}