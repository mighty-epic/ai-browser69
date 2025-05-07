// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { z } from 'zod';

const supabase = createClient();

// Zod schema for user data validation (adjust as per your user model)
const userSchema = z.object({
  email: z.string().email(),
  // Add other fields like password (for creation), roles, etc.
  // For updates, some fields might be optional
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  // role: z.enum(['admin', 'user', 'editor']).optional(), // Example roles
  // Add other updatable fields
});

// GET /api/users - Fetch all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication and authorization to ensure only admins can access
    // For now, this is a placeholder and assumes admin access

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // This uses the Supabase client library for auth.users, which might be different
    // from how you manage users in a custom 'profiles' or 'users' table.
    // Adjust if you have a separate table for user profiles with roles.
    const { data: { users }, error: usersError, count } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: limit,
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication and authorization
    const body = await request.json();

    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    // Example: Creating a user with Supabase Auth
    // This requires admin privileges for the Supabase client
    const { data, error } = await supabase.auth.admin.createUser({
      email: validation.data.email,
      password: body.password, // Ensure password is provided and handled securely
      email_confirm: true, // Or false, depending on your flow
      // user_metadata: { role: 'user' } // Example of setting custom metadata like role
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User created successfully', data: data.user }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/users/{userId} - Update a user (admin only)
// Note: Next.js file-based routing doesn't directly support /api/users/{userId} like this.
// You'd typically handle this by passing userId in the query or body, or use a dynamic route segment like /api/users/[userId]/route.ts
// For simplicity, this example will expect userId in the request body or as a query param.
export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement proper authentication and authorization
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id'); // Or get from body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const updateData: any = {};
    if (validation.data.email) updateData.email = validation.data.email;
    // if (validation.data.role) updateData.user_metadata = { ...updateData.user_metadata, role: validation.data.role };
    // Add other fields to updateData

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData);

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User updated successfully', data: data.user });
  } catch (error) {
    console.error('Error in PUT /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/users/{userId} - Delete a user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement proper authentication and authorization
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}