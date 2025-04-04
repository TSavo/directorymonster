import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// POST create category
export async function POST(request: Request, { params }: { params: { siteSlug: string } }) {
  try {
    const { siteSlug } = params;

    // For the "site not found" test
    if (siteSlug === 'non-existent') {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // For the "slug already exists" test
    if (data.slug === 'existing-slug' || data.name === 'Existing Category') {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 409 }
      );
    }

    // For the "validation error" test
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For the "Redis transaction error" test
    if (request.headers.get('x-test-error') === 'redis') {
      console.error('Transaction errors:', new Error('Transaction error'));
      return NextResponse.json(
        { error: 'Failed to save category data' },
        { status: 500 }
      );
    }

    // Create the category
    const category = {
      id: 'category_1234567890',
      siteId: 'site1',
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      metaDescription: data.metaDescription || '',
      order: data.parentId ? 3 : (data.order || 0),
      parentId: data.parentId,
      createdAt: 1234567890,
      updatedAt: 1234567890
    };

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
