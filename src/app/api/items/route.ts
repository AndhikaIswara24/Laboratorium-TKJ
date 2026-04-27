import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';

// GET all items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.inventoryItem.findMany({
      include: {
        borrowings: true,
        monitorings: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST new item (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, description, category, quantity } = body;

    if (!code || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Auto-generate QR code
    const qrData = JSON.stringify({
      code,
      name,
      timestamp: new Date().toISOString(),
    });

    let qrCodeUrl: string | null = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
      // Continue without QR code if generation fails
    }

    const item = await prisma.inventoryItem.create({
      data: {
        code,
        name,
        description: description || null,
        category,
        quantity: quantity || 1,
        qrCodeUrl,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
