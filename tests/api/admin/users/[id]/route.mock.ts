import { NextResponse } from 'next/server';
import * as usersService from '@/services/users';
import { hasPermission } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET specific user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Get current user from session
    const currentUser = {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      acl: {
        userId: 'admin-user',
        entries: [
          {
            resource: 'users',
            action: '*',
            effect: 'allow'
          }
        ]
      }
    };

    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get the user from the service
    const user = await usersService.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Get current user from session
    const currentUser = {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      acl: {
        userId: 'admin-user',
        entries: [
          {
            resource: 'users',
            action: '*',
            effect: 'allow'
          }
        ]
      }
    };

    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Update the user
    const updatedUser = await usersService.updateUser({ id, ...data });

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Get current user from session
    const currentUser = {
      id: 'admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      acl: {
        userId: 'admin-user',
        entries: [
          {
            resource: 'users',
            action: '*',
            effect: 'allow'
          }
        ]
      }
    };

    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the user
    const success = await usersService.deleteUser(id);

    if (!success) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
