// src/lib/seed.ts
import { createClient } from './supabaseClient';

const supabase = createClient();

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Seed Tags
  const tagsToSeed = [
    { name: 'Productivity', description: 'Tools that help you get things done more efficiently.' },
    { name: 'Development', description: 'Tools for software developers and engineers.' },
    { name: 'AI', description: 'Tools powered by Artificial Intelligence.' },
    { name: 'Design', description: 'Tools for graphic and UI/UX design.' },
    { name: 'Marketing', description: 'Tools for marketing and sales professionals.' },
    { name: 'Utilities', description: 'General purpose utility tools.' },
    { name: 'Research', description: 'Tools for academic and scientific research.' },
    { name: 'Collaboration', description: 'Tools for team communication and project management.' },
  ];

  console.log('Seeding tags...');
  const { data: seededTags, error: tagsError } = await supabase
    .from('tags')
    .insert(tagsToSeed)
    .select();

  if (tagsError) {
    console.error('Error seeding tags:', tagsError);
    // Check for unique constraint violation (e.g., if tags already exist)
    if (tagsError.code === '23505') { // unique_violation
      console.warn('Tags might already be seeded. Skipping tag seeding.');
    } else {
      return; // Stop seeding if a critical error occurs
    }
  }
  if (seededTags) {
    console.log(`${seededTags.length} tags seeded successfully (or were already present).`);
  }

  // Fetch all tags again to ensure we have IDs, especially if some were skipped due to existing
  const { data: allTags, error: fetchAllTagsError } = await supabase.from('tags').select('id, name');
  if (fetchAllTagsError) {
    console.error('Error fetching all tags after seeding attempt:', fetchAllTagsError);
    return;
  }
  if (!allTags || allTags.length === 0) {
    console.error('No tags found after seeding. Cannot proceed to seed tools.');
    return;
  }

  // Map tag names to their IDs for easy lookup
  const tagMap = new Map(allTags.map(tag => [tag.name, tag.id]));

  // Seed Tools
  const toolsToSeed = [
    {
      name: 'Notion',
      url: 'https://notion.so',
      description: 'The all-in-one workspace for your notes, tasks, wikis, and databases.',
      logo_url: 'https://www.notion.so/images/favicon.ico', // Placeholder, replace with actual or use a default
      status: 'approved',
      user_id: null, // Or a default admin user ID if you have one
      tagNames: ['Productivity', 'Collaboration'] // Names of tags to associate
    },
    {
      name: 'Figma',
      url: 'https://figma.com',
      description: 'A collaborative interface design tool.',
      logo_url: 'https://static.figma.com/app/icon/1/favicon.png', // Placeholder
      status: 'approved',
      user_id: null,
      tagNames: ['Design', 'Collaboration']
    },
    {
      name: 'GitHub Copilot',
      url: 'https://copilot.github.com/',
      description: 'Your AI pair programmer. Get suggestions for whole lines or entire functions right in your editor.',
      logo_url: 'https://copilot.github.com/favicon.ico', // Placeholder
      status: 'approved',
      user_id: null,
      tagNames: ['Development', 'AI']
    },
    {
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      description: 'A conversational AI model by OpenAI that can generate human-like text.',
      logo_url: 'https://chat.openai.com/favicon.ico', // Placeholder
      status: 'approved',
      user_id: null,
      tagNames: ['AI', 'Productivity', 'Research']
    },
    {
      name: 'Google Analytics',
      url: 'https://analytics.google.com/',
      description: 'Web analytics service that tracks and reports website traffic.',
      logo_url: 'https://www.google.com/favicon.ico', // Placeholder
      status: 'approved',
      user_id: null,
      tagNames: ['Marketing', 'Utilities']
    },
  ];

  console.log('Seeding tools...');
  const toolInsertPromises = toolsToSeed.map(async (toolData) => {
    const { tagNames, ...toolInsertData } = toolData;
    const { data: newTool, error: toolError } = await supabase
      .from('tools')
      .insert(toolInsertData)
      .select('id')
      .single();

    if (toolError) {
      console.error(`Error seeding tool