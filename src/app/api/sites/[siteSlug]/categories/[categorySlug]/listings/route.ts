// Mock API route created for tests
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: 'Mock API response' });
}
