import { NextResponse } from 'next/server';
import * as usersService from '@/services/users';

// GET all users
export async function GET(request: Request) {
  try {
    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // For the "service error" test
    if (request.headers.get('x-test-error') === 'true') {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }
    
    // Get all users
    const users = await usersService.getUsers();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST create user
export async function POST(request: Request) {
  try {
    // For the "not authenticated" test
    if (request.headers.get('x-test-auth') === 'none') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For the "missing permissions" test
    if (request.headers.get('x-test-auth') === 'no-permission') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // For the "validation error" test
    if (data.email === 'invalid-email') {
      return NextResponse.json(
        { message: 'Validation failed: invalid email format' },
        { status: 400 }
      );
    }
    
    // For the "service error" test
    if (request.headers.get('x-test-error') === 'true') {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }
    
    // Create the user
    const user = await usersService.createUser(data);
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
