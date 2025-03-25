import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API is working', time: new Date().toISOString() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'Request received',
      receivedData: body,
      time: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}