import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET all monitoring records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monitorings = await prisma.monitoring.findMany({
      include: {
        item: true,
        checkedBy: true,
      },
      orderBy: {
        checkDate: 'desc',
      },
    });

    return NextResponse.json(monitorings);
  } catch (error) {
    console.error('Error fetching monitorings:', error);
    return NextResponse.json({ error: 'Failed to fetch monitorings' }, { status: 500 });
  }
}

// POST new monitoring record
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'GURU')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, condition, notes } = body;

    if (!itemId || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const monitoring = await prisma.monitoring.create({
      data: {
        itemId,
        checkedById: session.user.id,
        condition,
        notes: notes || null,
      },
      include: {
        item: true,
        checkedBy: true,
      },
    });

    // Update item condition
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { condition },
    });

    return NextResponse.json(monitoring, { status: 201 });
  } catch (error) {
    console.error('Error creating monitoring:', error);
    return NextResponse.json({ error: 'Failed to create monitoring' }, { status: 500 });
  }
}
