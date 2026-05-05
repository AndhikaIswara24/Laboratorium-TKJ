import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Allow ADMIN and GURU to fetch reports
  if (session.user.role !== 'ADMIN' && session.user.role !== 'GURU') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const borrowings = await prisma.borrowing.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, name: true, code: true } }
      },
      orderBy: { borrowDate: 'desc' }
    });

    const rows = borrowings.map(b => ({
      id: b.id,
      borrowerId: b.userId,
      borrowerName: b.user?.name ?? b.userId,
      borrowerEmail: b.user?.email ?? null,
      itemId: b.itemId,
      itemName: b.item?.name ?? null,
      itemCode: b.item?.code ?? null,
      quantity: b.quantity,
      borrowDate: b.borrowDate,
      expectedReturnDate: b.expectedReturnDate,
      actualReturnDate: b.actualReturnDate,
      status: b.status,
      notes: b.notes || '',
    }));

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
