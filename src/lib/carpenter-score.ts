/**
 * CarpenterBullet Score Calculation Engine
 * Transparent, multi-factor scoring model (0.0 to 5.0).
 * Prevents pure pay-to-win ranking while rewarding verified performance.
 */

export interface CarpenterScoreMetrics {
  rating: number; // 1.0 - 5.0 average customer rating
  completedJobs: number; // Number of verified completed jobs
  responseRatePct: number; // 0 - 100% response rate
  responseTimeMinutes: number; // Avg response time in mins
  isVerified: boolean; // Verification status
  hasPortfolio: boolean; // Has portfolio projects/photos
}

export function calculateCarpenterScore(metrics: CarpenterScoreMetrics): {
  score: number;
  grade: string;
  badgeLabel: string;
} {
  const ratingWeight = 0.35;
  const jobsWeight = 0.25;
  const responseWeight = 0.20;
  const verificationWeight = 0.20;

  // Normalized rating score (1-5 scaled to 0-5)
  const ratingScore = Math.min(5, Math.max(0, metrics.rating));

  // Jobs score: capped at 50 jobs = 5.0 points
  const jobsScore = Math.min(5, (metrics.completedJobs / 50) * 5);

  // Response score: Combination of rate % and response speed under 30 mins
  const rateFactor = metrics.responseRatePct / 100;
  const speedFactor = metrics.responseTimeMinutes <= 15 ? 1 : metrics.responseTimeMinutes <= 60 ? 0.8 : 0.5;
  const responseScore = rateFactor * speedFactor * 5;

  // Verification & Profile score
  let verificationScore = 2.5;
  if (metrics.isVerified) verificationScore += 1.5;
  if (metrics.hasPortfolio) verificationScore += 1.0;

  const totalScore = Number(
    (
      ratingScore * ratingWeight +
      jobsScore * jobsWeight +
      responseScore * responseWeight +
      verificationScore * verificationWeight
    ).toFixed(1)
  );

  let grade = "Standard";
  let badgeLabel = "Registered Pro";

  if (totalScore >= 4.7) {
    grade = "Master Craftsman";
    badgeLabel = "Elite Pro";
  } else if (totalScore >= 4.3) {
    grade = "Top Rated";
    badgeLabel = "Verified Pro";
  } else if (totalScore >= 3.8) {
    grade = "Verified Service Provider";
    badgeLabel = "Verified";
  }

  return {
    score: totalScore,
    grade,
    badgeLabel,
  };
}
