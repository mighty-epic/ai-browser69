-- supabase/migrations/0000_initial_schema.sql

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update 'updated_at' timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tags Table: Stores categories for tools
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.tags IS 'Stores categories for AI tools.';

CREATE TRIGGER trigger_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tools Table: Stores information about AI tools
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL UNIQUE, -- Ensure URLs are unique to avoid duplicate tools
    -- embedding VECTOR(384), -- Example for semantic search, ensure pgvector is enabled and size matches your model
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: track who submitted/owns the tool
    approved_at TIMESTAMPTZ -- Optional: track when the tool was approved
);
COMMENT ON TABLE public.tools IS 'Stores information about AI tools, including names, descriptions, and URLs.';
-- COMMENT ON COLUMN public.tools.embedding IS 'Vector embedding for semantic search capabilities, requires pgvector extension.';

CREATE TRIGGER trigger_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tool_Tags Junction Table: Links tools to tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.tool_tags (
    tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tool_id, tag_id) -- Composite primary key to ensure unique tool-tag pairings
);
COMMENT ON TABLE public.tool_tags IS 'Junction table to link tools with their respective tags in a many-to-many relationship.';

-- Tool_Requests Table: Stores user submissions for new tools
CREATE TABLE IF NOT EXISTS public.tool_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    tags TEXT[], -- Storing tags as an array of strings (names) as submitted by user
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: track who submitted the request
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: admin who reviewed
    review_comment TEXT -- Optional: comment from admin
);
COMMENT ON TABLE public.tool_requests IS 'Stores user-submitted requests for new AI tools to be added to the platform.';

CREATE TRIGGER trigger_tool_requests_updated_at
BEFORE UPDATE ON public.tool_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_tools_name ON public.tools(name);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tool_requests_status ON public.tool_requests(status);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tool_id ON public.tool_tags(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag_id ON public.tool_tags(tag_id);

-- Enable Row Level Security (RLS) for all relevant tables
-- RLS is a crucial security feature in Supabase.
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_requests ENABLE ROW LEVEL SECURITY;

-- Default RLS Policies:
-- Generally, you might start with restrictive policies and then open up access as needed.
-- For this application, we'll allow public read access for tools and tags.
-- Requests will be more restricted.

-- Allow public read access to tags
DROP POLICY IF EXISTS "Public read access for tags" ON public.tags;
CREATE POLICY "Public read access for tags" ON public.tags
    FOR SELECT USING (true);

-- Allow public read access to tools
DROP POLICY IF EXISTS "Public read access for tools" ON public.tools;
CREATE POLICY "Public read access for tools" ON public.tools
    FOR SELECT USING (true);

-- Allow public read access to tool_tags (needed to join tools with their tags)
DROP POLICY IF EXISTS "Public read access for tool_tags" ON public.tool_tags;
CREATE POLICY "Public read access for tool_tags" ON public.tool_tags
    FOR SELECT USING (true);

-- Policies for tool_requests:
-- Allow any authenticated user to create a new tool request.
DROP POLICY IF EXISTS "Allow authenticated users to insert tool_requests" ON public.tool_requests;
CREATE POLICY "Allow authenticated users to insert tool_requests" ON public.tool_requests
    FOR INSERT TO authenticated WITH CHECK (true); -- Or add user_id check: auth.uid() = user_id

-- Allow users to view their own requests (if user_id column is used and populated)
-- DROP POLICY IF EXISTS "Allow users to read their own tool_requests" ON public.tool_requests;
-- CREATE POLICY "Allow users to read their own tool_requests" ON public.tool_requests
--    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- For admin access to all requests, API routes will use ADMIN_KEY which implies service_role privileges, bypassing RLS.
-- However, if admins were to access requests via client-side Supabase directly with their user, specific admin RLS policies would be needed.

-- Example: Allow public read for *approved* tool requests if needed for some public log, otherwise restrict.
-- For now, we assume requests are primarily managed by admins and not publicly listed post-processing.
-- If you want users to see the status of their *own* requests, a policy based on auth.uid() would be appropriate.

-- Note on Embeddings (if used in the future):
-- If you add the `embedding` column to `public.tools` and use pgvector:
-- 1. Ensure the pgvector extension is enabled in your Supabase project (Database -> Extensions).
-- 2. Create the function for similarity search (example below was commented out, uncomment and adapt if needed).

-- Example pgvector search function (adapt column names and vector size):
-- CREATE OR REPLACE FUNCTION match_tools_by_embedding (
--   query_embedding vector(384), -- Match this to your embedding model's output dimension
--   match_threshold float,    -- Minimum similarity score (e.g., 0.7)
--   match_count int           -- Maximum number of results
-- )
-- RETURNS TABLE ( 
--   id uuid, 
--   name text, 
--   description text, 
--   url text, 
--   similarity float 
-- )
-- LANGUAGE sql STABLE PARALLEL SAFE
-- AS $$
--   SELECT
--     t.id,
--     t.name,
--     t.description,
--     t.url,
--     1 - (t.embedding <=> query_embedding) AS similarity -- Cosine similarity
--   FROM public.tools t
--   WHERE 1 - (t.embedding <=> query_embedding) > match_threshold
--   ORDER BY similarity DESC
--   LIMIT match_count;
-- $$;

-- Seed initial data (Optional - for development/testing)
-- Consider adding a separate seeding script if data becomes complex.

-- Example: Seed a few tags
-- INSERT INTO public.tags (name) VALUES
--   ('AI Assistant'),
--   ('Content Generation'),
--   ('Image Processing'),
--   ('Developer Tools'),
--   ('Productivity')
-- ON CONFLICT (name) DO NOTHING;

-- Example: Seed a tool
-- WITH new_tool AS (
--   INSERT INTO public.tools (name, description, url) 
--   VALUES ('Sample AI Writer', 'Helps write articles using AI.', 'https://sampleaiwriter.com')
--   ON CONFLICT (url) DO NOTHING -- Avoid error if URL already exists
--   RETURNING id
-- )
-- INSERT INTO public.tool_tags (tool_id, tag_id)
-- SELECT nt.id, tg.id 
-- FROM new_tool nt, public.tags tg 
-- WHERE tg.name IN ('AI Assistant', 'Content Generation') AND nt.id IS NOT NULL
-- ON CONFLICT (tool_id, tag_id) DO NOTHING;