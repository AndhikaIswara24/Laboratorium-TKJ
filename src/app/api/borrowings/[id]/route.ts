import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const borrowing = await prisma.borrowing.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        item: true,
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    return NextResponse.json(borrowing);
  } catch (error) {
    console.error('Error fetching borrowing:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowing' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, actualReturnDate, notes } = body;

    const borrowing = await prisma.borrowing.findUnique({
      where: { id: params.id },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    // Only admin can change status, or user can return their own item
    if (session.user.role !== 'ADMIN' && borrowing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedBorrowing = await prisma.borrowing.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(actualReturnDate && { actualReturnDate: new Date(actualReturnDate) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        user: true,
        item: true,
      },
    });

    return NextResponse.json(updatedBorrowing);
  } catch (error) {
    console.error('Error updating borrowing:', error);
    return NextResponse.json({ error: 'Failed to update borrowing' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.borrowing.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Borrowing deleted successfully' });
  } catch (error) {
    console.error('Error deleting borrowing:', error);
    return NextResponse.json({ error: 'Failed to delete borrowing' }, { status: 500 });
  }
}
