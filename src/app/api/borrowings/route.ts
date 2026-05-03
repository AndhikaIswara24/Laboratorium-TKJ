import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET all borrowings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const borrowings = await prisma.borrowing.findMany({
      include: {
        user: true,
        item: true,
      },
      orderBy: {
        borrowDate: 'desc',
      },
    });

    return NextResponse.json(borrowings);
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowings' }, { status: 500 });
  }
}

// POST new borrowing request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, expectedReturnDate, notes } = body;

    if (!itemId || !expectedReturnDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if item exists and has stock
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.quantity <= 0) {
      return NextResponse.json(
        { error: 'Item not available' },
        { status: 400 }
      );
    }

    const borrowing = await prisma.borrowing.create({
      data: {
        userId: session.user.id,
        itemId,
        expectedReturnDate: new Date(expectedReturnDate),
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        user: true,
        item: true,
      },
    });

    return NextResponse.json(borrowing, { status: 201 });
  } catch (error) {
    console.error('Error creating borrowing:', error);
    return NextResponse.json({ error: 'Failed to create borrowing' }, { status: 500 });
  }
}
