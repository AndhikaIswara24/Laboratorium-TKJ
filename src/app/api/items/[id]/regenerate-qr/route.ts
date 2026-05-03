import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Generate new QR code
    const qrData = JSON.stringify({
      itemId: item.id,
      code: item.code,
      name: item.name,
      timestamp: new Date().toISOString(),
    });

    let qrCodeUrl: string | null = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    // Update item with new QR code
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: { qrCodeUrl },
      include: {
        borrowings: true,
        monitorings: true,
        evaluations: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate QR code' },
      { status: 500 }
    );
  }
}
