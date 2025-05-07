// src/types/index.ts

export interface Tool {
  id: string; // UUID
  name: string;
  description?: string | null;
  url: string;
  created_at: string; // TIMESTAMPTZ
  embedding?: number[] | null; // VECTOR
  tags?: Tag[]; // Populated from tool_tags
}

export interface Tag {
  id: string; // UUID
  name: string;
  created_at: string; // TIMESTAMPTZ
}

export interface ToolTag {
  tool_id: string; // UUID
  tag_id: string; // UUID
}

export interface Request {
  id: string; // UUID
  name: string;
  url: string;
  description?: string | null;
  tags?: string | null; // Comma-separated string or JSON
  status: 'pending' | 'approved' | 'denied';
  created_at: string; // TIMESTAMPTZ
}

// For API responses, especially for tools with tags
export interface ToolWithTags extends Tool {
  tags: Tag[];
}

// For search results that include similarity score
export interface ToolSearchResult extends Tool {
  similarity?: number;
  tags?: Tag[];
}