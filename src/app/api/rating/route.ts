import { NextRequest, NextResponse } from 'next/server';
import { RatingReview, UserRatingsSummary } from '@/types';

export const dynamic = 'force-dynamic';

// In-memory persistent store across Next.js dev & serverless process invocations
declare global {
  var __scrapmax_ratings_db: RatingReview[] | undefined;
}

const getRatingsDb = (): RatingReview[] => {
  if (!globalThis.__scrapmax_ratings_db) {
    globalThis.__scrapmax_ratings_db = [];
  }
  return globalThis.__scrapmax_ratings_db;
};

/**
 * POST /api/rating
 * Submit a rating for a transaction (from customer to kabadiwala or vice-versa)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_id,
      reviewer_id,
      reviewer_type,
      reviewee_id,
      rating,
      review_comment,
    } = body ?? {};

    // 1. Validation matching Python Pydantic schema
    if (!transaction_id || typeof transaction_id !== 'string') {
      return NextResponse.json(
        { detail: 'transaction_id is required and must be a string.', error: 'Invalid transaction_id' },
        { status: 400 }
      );
    }

    if (!reviewer_id || typeof reviewer_id !== 'string') {
      return NextResponse.json(
        { detail: 'reviewer_id is required and must be a string.', error: 'Invalid reviewer_id' },
        { status: 400 }
      );
    }

    if (!reviewer_type || !['customer', 'kabadiwala', 'collector'].includes(reviewer_type)) {
      return NextResponse.json(
        { detail: 'reviewer_type must be either "customer", "collector", or "kabadiwala".', error: 'Invalid reviewer_type' },
        { status: 400 }
      );
    }

    if (!reviewee_id || typeof reviewee_id !== 'string') {
      return NextResponse.json(
        { detail: 'reviewee_id is required and must be a string.', error: 'Invalid reviewee_id' },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
      return NextResponse.json(
        { detail: 'rating must be a numeric score between 1.0 and 5.0.', error: 'Invalid rating' },
        { status: 400 }
      );
    }

    const db = getRatingsDb();

    // 2. Duplicate submission prevention
    const alreadySubmitted = db.some(
      (r) => r.transaction_id === transaction_id && r.reviewer_id === reviewer_id
    );

    if (alreadySubmitted) {
      return NextResponse.json(
        { detail: 'Rating already submitted for this transaction.', error: 'Duplicate rating' },
        { status: 400 }
      );
    }

    // 3. Create entry
    const entry: RatingReview = {
      id: `rate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      transaction_id,
      reviewer_id,
      reviewer_type,
      reviewee_id,
      rating: Math.round(numRating * 10) / 10,
      review_comment: review_comment ? String(review_comment).trim() : null,
      timestamp: new Date().toISOString(),
    };

    db.push(entry);

    return NextResponse.json(
      {
        status: 'success',
        message: `Rating recorded for ${reviewer_type} -> ${reviewee_id}`,
        rating: entry.rating,
        data: entry,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { detail: error.message || 'Failed to process rating submission', error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rating?user_id=xyz or /api/rating?transaction_id=abc
 * Fetch user profile ratings summary or all ratings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || searchParams.get('userId');
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
    const reviewerId = searchParams.get('reviewer_id') || searchParams.get('reviewerId');

    const db = getRatingsDb();

    // 1. Query by User ID (matches get_user_ratings: reviews where user is reviewee)
    if (userId) {
      const userReviews = db.filter((r) => r.reviewee_id === userId);

      if (userReviews.length === 0) {
        const emptySummary: UserRatingsSummary = {
          user_id: userId,
          average_rating: 0.0,
          total_reviews: 0,
          reviews: [],
        };
        return NextResponse.json(emptySummary);
      }

      const totalScore = userReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgScore = Math.round((totalScore / userReviews.length) * 100) / 100;

      const summary: UserRatingsSummary = {
        user_id: userId,
        average_rating: avgScore,
        total_reviews: userReviews.length,
        reviews: userReviews,
      };

      return NextResponse.json(summary);
    }

    // 2. Query by Transaction ID (optionally refined by reviewer_id)
    if (transactionId) {
      let txReviews = db.filter((r) => r.transaction_id === transactionId);
      if (reviewerId) {
        txReviews = txReviews.filter((r) => r.reviewer_id === reviewerId);
      }
      return NextResponse.json({
        transaction_id: transactionId,
        total_reviews: txReviews.length,
        reviews: txReviews,
      });
    }

    // 3. Return all ratings overview
    return NextResponse.json({
      status: 'success',
      total_reviews: db.length,
      reviews: db,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { detail: error.message || 'Failed to retrieve ratings', error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
