// src/app/api/tools/admin/route.ts - Renamed to avoid conflict and for clarity
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Tool, Tag } from '@/types';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import '@tensorflow/tfjs-backend-cpu';

const ADMIN_KEY = process.env.ADMIN_KEY;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${ADMIN_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, url, tags } = body as { name: string; description?: string; url: string; tags?: string[] }; // tags are names

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    // Generate embedding for the tool's name and description
    let embeddingVector = null;
    try {
        const model = await use.load();
        const textToEmbed = `${name} ${description || ''}`.trim();
        if (textToEmbed) {
            const embedding = await model.embed([textToEmbed]);
            embeddingVector = Array.from(await embedding.data());
            embedding.dispose();
        }
    } catch (e) {
        console.error('Failed to generate embedding:', e);
        // Proceed without embedding if generation fails, or handle error as critical
    }

    const { data: newTool, error: toolError } = await supabase
      .from('tools')
      .insert({
        name,
        description,
        url,
        embedding: embeddingVector,
      })
      .select()
      .single();

    if (toolError) throw toolError;
    if (!newTool) throw new Error('Failed to create tool');

    // Handle tags
    const createdTags: Tag[] = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let { data: tag, error: tagError } = await supabase
          .from('tags')
          .select('id, name')
          .eq('name', tagName)
          .single();

        if (tagError && tagError.code !== 'PGRST116') { // PGRST116: 0 rows
            console.error(`Error fetching tag ${tagName}:`, tagError);
            // Decide if to continue or throw
        }

        if (!tag) {
          const { data: newTag, error: newTagError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id, name')
            .single();
          if (newTagError) {
            console.error(`Error creating tag ${tagName}:`, newTagError);
            continue; // Skip this tag
          }
          tag = newTag;
        }
        
        if (tag) {
            createdTags.push(tag as Tag);
            const { error: toolTagError } = await supabase
                .from('tool_tags')
                .insert({ tool_id: newTool.id, tag_id: tag.id });
            if (toolTagError) {
                console.error(`Error linking tool ${newTool.id} to tag ${tag.id}:`, toolTagError);
            }
        }
      }
    }

    return NextResponse.json({ ...newTool, tags: createdTags }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/tools/admin:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tool' }, { status: 500 });
  }
}