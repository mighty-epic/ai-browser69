// src/types/tool.ts

// Represents a single tag
export interface Tag {
  id: string; // Or number, depending on your DB schema
  name: string;
  // created_at?: string; // Optional: if you track creation dates for tags
}

// Represents a single tool
export interface Tool {
  id: string; // Or number, depending on your DB schema
  name: string;
  description: string;
  url: string;
  // logo_url?: string; // Optional: URL for the tool's logo
  // website_url?: string; // Optional: if different from the tool's primary URL
  tags: Tag[]; // Array of associated tags
  // Alternatively, if tags are just strings:
  // tags: string[]; 
  // category?: string; // Optional: if tools have a single category
  // categories?: Category[]; // Optional: if tools can belong to multiple categories (similar to tags)
  // created_at?: string; // Optional: submission or approval date
  // updated_at?: string; // Optional: last update date
  // approved_at?: string | null; // Optional: timestamp if approved, null otherwise
  // requested_by?: string; // Optional: user ID or email of requester
  // upvotes?: number; // Optional: for community voting
  // is_featured?: boolean; // Optional: to highlight certain tools
  // pricing_type?: 'free' | 'paid' | 'freemium' | 'contact'; // Optional
  // platform?: ('web' | 'desktop' | 'mobile')[]; // Optional
  // Add any other relevant fields for your tools
}

// For API responses that include pagination details
export interface PaginatedToolsResponse {
  tools: Tool[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// For tool submission requests
export interface ToolRequest {
  id?: string; // Optional: if it's an existing request being updated
  name: string;
  url: string;
  description: string;
  tags?: string[]; // Tags as an array of strings or names
  // category?: string;
  submitted_at?: string;
  status?: 'pending' | 'approved' | 'rejected';
  // user_email?: string; // Optional: if tracking who submitted
}

// If you have a separate Category type
// export interface Category {
//   id: string; // Or number
//   name: string;
// }