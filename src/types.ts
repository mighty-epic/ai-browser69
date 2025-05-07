// src/types.ts

// Represents a Tag for categorizing tools
export interface Tag {
  id: string; // UUID from Supabase
  name: string;
  created_at: string; // ISO date string
}

// Represents an AI Tool
export interface Tool {
  id: string; // UUID from Supabase
  name: string;
  description: string | null;
  url: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // Embedding might be a large array of numbers, consider if it's always needed client-side
  // embedding?: number[] | null; 
  // user_id?: string | null; // If you track who submitted it
  // approved_at?: string | null; // If you track approval time
}

// Represents a Tool with its associated Tags (names or objects)
export interface ToolWithTags extends Tool {
  tags: Pick<Tag, 'id' | 'name'>[]; // Array of tag objects (or just names if preferred)
}

// Represents a User's request to add a new tool
export interface Request {
  id: string; // UUID from Supabase
  name: string;
  url: string;
  description: string | null;
  tags: string[]; // Storing tags as an array of strings (names) as submitted by user
  status: 'pending' | 'approved' | 'denied';
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // user_id?: string | null; // If you track the user who made the request
  // reviewed_by?: string | null; // Admin who reviewed
  // review_comment?: string | null; // Comment from admin
}

// For API responses that include pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// For the main tools API endpoint (/api/tools)
export interface ToolsApiResponse {
  tools: ToolWithTags[];
  total: number;
  page: number;
  limit: number;
}

// For the admin requests API endpoint (/api/requests/admin)
export interface AdminRequestsApiResponse {
  requests: Request[];
  total: number;
  page: number;
  limit: number;
}