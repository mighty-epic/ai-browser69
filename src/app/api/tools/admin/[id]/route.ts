// src/app/api/tools/admin/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Tool, Tag } from '@/types';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import '@tensorflow/tfjs-backend-cpu';

const ADMIN_KEY = process.env.ADMIN_KEY;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${ADMIN_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, url, tags } = body as { name?: string; description?: string; url?: string; tags?: string[] };

    // Fetch the existing tool to compare for embedding regeneration
    const { data: existingTool, error: fetchError } = await supabase
      .from('tools')
      .select('name, description')
      .eq('id', id)
      .single();

    if (fetchError || !existingTool) {
      return NextResponse.json({ error: 'Tool not found or error fetching it' }, { status: 404 });
    }

    const updatePayload: Partial<Tool> = {};
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (url !== undefined) updatePayload.url = url;

    // Regenerate embedding if name or description changed
    if (name !== undefined || description !== undefined) {
      const textToEmbed = `${name || existingTool.name} ${description === undefined ? existingTool.description || '' : description || ''}`.trim();
      if (textToEmbed) {
        try {
            const model = await use.load();
            const embedding = await model.embed([textToEmbed]);
            updatePayload.embedding = Array.from(await embedding.data());
            embedding.dispose();
        } catch(e) {
            console.error('Failed to regenerate embedding for tool update:', e);
            // Decide if this is a critical error or proceed without updating embedding
        }
      }
    }

    if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
        .from('tools')
        .update(updatePayload)
        .eq('id', id);

        if (updateError) throw updateError;
    }

    // Handle tags: clear existing and add new ones
    // This is a simple approach; more sophisticated diffing could be used.
    if (tags !== undefined) {
      // Delete existing tag associations for this tool
      const { error: deleteTagsError } = await supabase
        .from('tool_tags')
        .delete()
        .eq('tool_id', id);

      if (deleteTagsError) {
        console.error(`Error clearing tags for tool ${id}:`, deleteTagsError);
        // Potentially throw or return error response
      }

      const updatedToolTags: Tag[] = [];
      if (tags.length > 0) {
        for (const tagName of tags) {
          let { data: tag, error: tagError } = await supabase
            .from('tags')
            .select('id, name')
            .eq('name', tagName)
            .single();

          if (tagError && tagError.code !== 'PGRST116') {
            console.error(`Error fetching tag ${tagName}:`, tagError);
          }

          if (!tag) {
            const { data: newTag, error: newTagError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('id, name')
              .single();
            if (newTagError) {
              console.error(`Error creating tag ${tagName}:`, newTagError);
              continue;
            }
            tag = newTag;
          }

          if (tag) {
            updatedToolTags.push(tag as Tag);
            const { error: toolTagError } = await supabase
              .from('tool_tags')
              .insert({ tool_id: id, tag_id: tag.id });
            if (toolTagError) {
              console.error(`Error linking tool ${id} to tag ${tag.id}:`, toolTagError);
            }
          }
        }
      }
    }
    
    // Fetch the updated tool with its tags to return
    const { data: finalUpdatedTool, error: finalFetchError } = await supabase
        .from('tools')
        .select('*, tool_tags(tags(id, name, created_at))')
        .eq('id', id)
        .single();

    if (finalFetchError || !finalUpdatedTool) {
        return NextResponse.json({ error: 'Failed to fetch updated tool details' }, { status: 500 });
    }

    const responseTool = {
        ...finalUpdatedTool,
        tags: finalUpdatedTool.tool_tags.map((tt: any) => tt.tags)
    };
    delete (responseTool as any).tool_tags;

    return NextResponse.json(responseTool);

  } catch (error: any) {
    console.error(`Error in PUT /api/tools/admin/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${ADMIN_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
  }

  try {
    // Related tool_tags will be deleted by CASCADE constraint if set up in DB schema
    // If not, delete them manually first:
    // await supabase.from('tool_tags').delete().eq('tool_id', id);

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Tool deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in DELETE /api/tools/admin/${id}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to delete tool' }, { status: 500 });
  }
}