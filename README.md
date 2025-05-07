# AI Tool Browser

Welcome to the AI Tool Browser! This is a web application designed to help users discover and explore a curated directory of Artificial Intelligence tools and resources. Users can search, filter by tags, and find the best AI solutions for their needs. New tools can also be suggested by users via a submission form, which are then reviewed by administrators.

## Features

- **Tool Directory:** Browse a comprehensive list of AI tools.
- **Search Functionality:** Quickly find tools by keywords in their name or description.
- **Tag-Based Filtering:** Filter tools based on specific categories or tags.
- **Pagination:** Efficiently navigate through large lists of tools.
- **Responsive Design:** Optimized for various screen sizes (desktop, tablet, mobile).
- **Light & Dark Modes:** Theme support for user preference.
- **Tool Suggestion:** Users can submit new tools for inclusion in the directory.
- **Admin Panel (Basic):** Interface for administrators to review and manage tool submissions (approve/reject).
- **API Endpoints:** For fetching tools, tags, and handling submissions.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React framework)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Supabase](https://supabase.io/) (PostgreSQL backend with additional services)
- **UI Components:** Custom components, potentially using [Headless UI](https://headlessui.dev/) or similar for accessibility, and [Heroicons](https://heroicons.com/) for icons.
- **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`)
- **Linting/Formatting:** ESLint, Prettier (assumed, standard for Next.js projects)

## Project Structure

```
ai-browser/
├── public/                     # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (user)/             # User-facing routes (e.g., main directory)
│   │   │   ├── layout.tsx      # Layout for user pages
│   │   │   └── page.tsx        # Main tool directory page
│   │   ├── admin/              # Admin-specific routes
│   │   │   ├── layout.tsx      # Layout for admin pages
│   │   │   └── page.tsx        # Admin dashboard/tool request management
│   │   ├── api/                # API route handlers
│   │   │   ├── tools/route.ts  # API for tools (GET)
│   │   │   ├── tags/route.ts   # API for tags (GET)
│   │   │   └── requests/route.ts # API for tool requests (POST, GET for admin)
│   │   ├── layout.tsx          # Root layout for the entire application
│   │   └── globals.css       # Global styles
│   ├── components/             # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ToolCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── TagFilter.tsx
│   │   ├── Pagination.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── RequestModal.tsx
│   ├── lib/                    # Utility functions, Supabase client
│   │   └── supabaseClient.ts # Supabase client initialization
│   └── types/                  # TypeScript type definitions
│       └── tool.ts           # Types for Tool, Tag, etc.
├── .env.local                  # Local environment variables (Supabase keys, etc. - GITIGNORED)
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Files and folders to ignore in Git
├── next.config.js              # Next.js configuration
├── package.json                # Project dependencies and scripts
├── postcss.config.js           # PostCSS configuration (for Tailwind CSS)
├── README.md                   # This file
└── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.io/) account and project.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-browser.git # Replace with your repo URL
    cd ai-browser
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Supabase:**
    *   Create a new project on [Supabase](https://app.supabase.io).
    *   In your Supabase project, you'll need to set up the following tables (example schema):
        *   `tools`: `id (uuid, pk)`, `name (text)`, `description (text)`, `url (text, unique)`, `tags (text[])`, `created_at (timestampz)`, `approved_at (timestampz, nullable)` etc.
        *   `tags`: `id (uuid, pk)`, `name (text, unique)`, `created_at (timestampz)`
        *   `tool_requests`: `id (uuid, pk)`, `name (text)`, `url (text)`, `description (text)`, `tags (text[])`, `submitted_at (timestampz)`, `status (text, default 'pending')`
        *   (Consider a join table `tool_tags` if you prefer a many-to-many relationship for tools and tags instead of `text[]` in `tools`)
    *   Enable Row Level Security (RLS) on your tables and define policies for access (e.g., public read access for `tools` and `tags`, restricted access for `tool_requests`).

4.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the root of the project by copying `.env.example` (if provided) or creating it manually.
    *   Add your Supabase project URL and public anon key to `.env.local`:
        ```env
        NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
        NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
        ```
        You can find these in your Supabase project settings (API section).

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running at [http://localhost:3000](http://localhost:3000).

### Database Migrations (Optional - if using Supabase CLI)

If you manage your database schema with Supabase CLI migrations:

1.  Install Supabase CLI: `npm install supabase --save-dev` (or globally)
2.  Link your project: `supabase link --project-ref YOUR_PROJECT_ID`
3.  Pull existing schema changes: `supabase db pull` (if schema was created via UI first)
4.  Create new migrations: `supabase migration new <migration_name>`
5.  Apply migrations locally (if using local Supabase instance): `supabase start` then `supabase db reset`
6.  Apply migrations to linked project: `supabase db push`

## Running Tests

(Assuming tests will be added - e.g., with Jest/React Testing Library or Cypress)

```bash
npm test
# or
yarn test
```

## Building for Production

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `.next` folder.

## Deployment

This Next.js application can be deployed to various platforms like:

-   [Vercel](https://vercel.com/) (Recommended for Next.js projects)
-   [Netlify](https://www.netlify.com/)
-   AWS Amplify
-   Heroku
-   Self-hosted (Node.js server)

Ensure your environment variables (Supabase URL and anon key) are set up in your deployment provider's settings.

## Contributing

(Details on how to contribute if this were an open-source project - e.g., fork, feature branch, pull request process, coding standards).

## License

(Specify a license, e.g., MIT License).

---

This README provides a starting point. You should update it with specific details about your Supabase schema, actual deployment URLs, and any other project-specific information as you develop the application.
