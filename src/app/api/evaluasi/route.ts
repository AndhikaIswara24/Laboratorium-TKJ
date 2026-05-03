import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDetailedEvaluation, ItemFeatures } from '@/lib/naiveBayes';

// GET all evaluations (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const evaluations = await prisma.naiveBayesEvaluation.findMany({
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            condition: true,
            conditionScore: true,
            repairsCount: true,
            acquisitionDate: true,
          },
        },
      },
      orderBy: {
        evaluationDate: 'desc',
      },
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

// POST evaluate item (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, ageInYears, frequencyPerMonth, repairsCount, conditionScore } = body;

    // Validate input
    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    if (
      ageInYears === undefined ||
      frequencyPerMonth === undefined ||
      repairsCount === undefined ||
      conditionScore === undefined
    ) {
      return NextResponse.json(
        { error: 'All feature fields are required: ageInYears, frequencyPerMonth, repairsCount, conditionScore' },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Validate feature values
    if (
      ageInYears < 0 ||
      frequencyPerMonth < 0 ||
      repairsCount < 0 ||
      conditionScore < 1 ||
      conditionScore > 5
    ) {
      return NextResponse.json(
        { error: 'Invalid feature values. Age and frequency must be >= 0, repairs must be >= 0, condition score must be 1-5' },
        { status: 400 }
      );
    }

    // Create features object for Naive Bayes
    const features: ItemFeatures = {
      ageInYears: parseFloat(ageInYears),
      frequencyPerMonth: parseInt(frequencyPerMonth),
      repairsCount: parseInt(repairsCount),
      conditionScore: parseInt(conditionScore),
    };

    // Evaluate using Naive Bayes
    const evaluation = getDetailedEvaluation(features);

    // Save evaluation to database
    const savedEvaluation = await prisma.naiveBayesEvaluation.create({
      data: {
        itemId,
        ageInYears: features.ageInYears,
        frequencyPerMonth: features.frequencyPerMonth,
        repairsCount: features.repairsCount,
        conditionScore: features.conditionScore,
        result: evaluation.classification,
        probability: evaluation.probability,
        usableProbability: evaluation.usableProbability,
        needsRepairProbability: evaluation.needsRepairProbability,
        notUsableProbability: evaluation.notUsableProbability,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            condition: true,
            conditionScore: true,
            repairsCount: true,
            acquisitionDate: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        evaluation: {
          id: savedEvaluation.id,
          itemId: savedEvaluation.itemId,
          item: savedEvaluation.item,
          evaluationDate: savedEvaluation.evaluationDate,
          features: {
            ageInYears: features.ageInYears,
            frequencyPerMonth: features.frequencyPerMonth,
            repairsCount: features.repairsCount,
            conditionScore: features.conditionScore,
          },
          result: {
            classification: evaluation.classification,
            probability: evaluation.probability,
            percentageScore: evaluation.percentageScore,
            usableProbability: evaluation.usableProbability,
            needsRepairProbability: evaluation.needsRepairProbability,
            notUsableProbability: evaluation.notUsableProbability,
            usablePercentage: evaluation.usablePercentage,
            needsRepairPercentage: evaluation.needsRepairPercentage,
            notUsablePercentage: evaluation.notUsablePercentage,
            confidence: evaluation.confidence,
            confidencePercentage: evaluation.confidencePercentage,
            reasoning: evaluation.reasoning,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error evaluating item:', error);
    return NextResponse.json({ error: 'Failed to evaluate item' }, { status: 500 });
  }
}
