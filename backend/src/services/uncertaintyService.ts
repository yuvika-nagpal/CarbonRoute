/**
 * Uncertainty & Risk Calibration Engine
 * Implements Gaussian tail error modeling and horizon-dependent forecast variance growth.
 */
export class UncertaintyService {
  /**
   * Evaluates the cumulative probability of a deadline violation given:
   * @param startHour Scheduled start time slot (hours from arrival)
   * @param durationHours Job run duration (hours)
   * @param deadlineHours Absolute deadline limit (hours)
   * @param baseStdDev Standard deviation of the forecast error at the scheduled slot
   * @param uncertaintyScale Multiplier to simulate varying uncertainty scenarios (e.g. 1.0 for low, 3.5 for high)
   */
  public static calculateDeadlineRisk(
    startHour: number,
    durationHours: number,
    deadlineHours: number,
    baseStdDev: number,
    uncertaintyScale: number = 1.0
  ): { violationRisk: number; effectiveStdDev: number; slackHours: number; zScore: number } {
    const slack = deadlineHours - (startHour + durationHours);

    // If already infeasible by deterministic deadline constraint
    if (slack < 0) {
      return {
        violationRisk: 1.0,
        effectiveStdDev: Number((baseStdDev * uncertaintyScale).toFixed(2)),
        slackHours: Number(slack.toFixed(2)),
        zScore: -999,
      };
    }

    // Effective completion-time standard deviation in hours
    // Accounts for intrinsic runtime variance (15% of duration) + horizon arrival jitter
    const runtimeStdDev = Math.max(0.2, 0.15 * durationHours);
    const horizonJitter = 0.08 * Math.sqrt(Math.max(0, startHour));
    const effectiveTimeStdDev = Math.max(0.25, (runtimeStdDev + horizonJitter) * Math.max(0.5, uncertaintyScale));

    // Z-score: how many standard deviations of slack remain
    const zScore = slack / effectiveTimeStdDev;

    // Erfc approximation for standard normal complementary cumulative distribution tail
    const violationRisk = Math.min(1.0, Math.max(0.0, 0.5 * this.erfc(zScore / Math.SQRT2)));

    return {
      violationRisk: Number(violationRisk.toFixed(4)),
      effectiveStdDev: Number(effectiveTimeStdDev.toFixed(2)),
      slackHours: Number(slack.toFixed(2)),
      zScore: Number(zScore.toFixed(3)),
    };
  }

  /**
   * Calculates carbon forecast uncertainty standard deviation widening over look-ahead horizon
   */
  public static calculateHorizonStdDev(
    horizonHour: number,
    baseStdDev: number = 15,
    growthRate: number = 0.20
  ): number {
    const sigma = baseStdDev * (1.0 + growthRate * Math.sqrt(Math.max(0, horizonHour)));
    return Number(sigma.toFixed(2));
  }

  /**
   * Approximates the complementary error function erfc(x)
   * Chebyshev fitting approximation accurate to 1.2e-7
   */
  public static erfc(x: number): number {
    if (x < 0) {
      return 2 - this.erfc(-x);
    }
    const t = 1.0 / (1.0 + 0.5 * x);
    const tau =
      t *
      Math.exp(
        -x * x -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 +
                      t *
                        (-0.18628806 +
                          t *
                            (0.27886807 +
                              t *
                                (-1.13520398 +
                                  t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
      );
    return tau;
  }
}
