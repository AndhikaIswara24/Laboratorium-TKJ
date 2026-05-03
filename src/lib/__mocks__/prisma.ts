import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import prisma from '../prisma';
import { beforeEach, vi } from 'vitest';

vi.mock('../prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Setup NextAuth mock globally
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Setup Next.js cache revalidatePath mock
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
