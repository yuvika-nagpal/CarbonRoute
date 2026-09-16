import { config } from '../config';

export interface HourlyCarbonPoint {
  hour: number;
  offsetHour: number;
  timestamp: string;
  predictedCarbon: number; // gCO2eq/kWh
  carbonIntensity: number; // alias for consistency
  uncertaintyAvailable: boolean; // false in current live mode
  uncertaintyStatus: 'not_calibrated' | 'calibrated' | 'benchmark_demo';
  stdDev?: number | null; // null when uncalibrated in live mode
  uncertainty?: number | null; // alias
  uncertaintyStdDev?: number | null; // alias
  confidenceLow?: number | null;
  confidenceHigh?: number | null;
}

export interface CarbonForecastData {
  source: string;
  region: string;
  regionName: string;
  timestamp: string;
  dataMode: 'live' | 'demo';
  traceVersion: string;
  forecastHorizonHours: number;
  timeResolution: string;
  hourlyProfile: HourlyCarbonPoint[];
  averageCarbon: number;
  minCarbon: number;
  maxCarbon: number;
  uncertaintyStatus: 'not_calibrated' | 'calibrated' | 'benchmark_demo';
}

export interface ICarbonDataProvider {
  name: string;
  source: string;
  dataMode: 'live' | 'demo';
  getForecast(region: string, horizonHours?: number): Promise<CarbonForecastData>;
  getAvailableRegions(): Array<{ code: string; name: string }>;
}

// 24-hour baseline traces representing characteristic regional grid mixes (for demo mode only)
export const REGIONAL_PROFILES: Record<
  string,
  { name: string; baseCurve: number[] }
> = {
  'BENCHMARK-RESEARCH': {
    name: 'DEMO / BENCHMARK - Controlled Experiment Trace',
    baseCurve: [
      340, 320, 220, 215, 230, 270, 310, 330, 210, 180,
      135, 130, 160, 210, 260, 300, 340, 370, 360, 340,
      320, 310, 300, 290,
    ],
  },
  'US-CAL-CISO': {
    name: 'California (CAISO)',
    baseCurve: [
      310, 295, 285, 280, 290, 320, 360, 340, 280, 220,
      170, 150, 140, 145, 160, 190, 260, 350, 390, 370,
      340, 320, 310, 305,
    ],
  },
  'US-TEX-ERCO': {
    name: 'Texas (ERCOT)',
    baseCurve: [
      230, 210, 195, 190, 205, 240, 280, 310, 330, 345,
      360, 375, 390, 410, 420, 410, 390, 360, 320, 290,
      270, 250, 240, 235,
    ],
  },
  'DE': {
    name: 'Germany (Central Europe)',
    baseCurve: [
      380, 365, 350, 340, 355, 390, 430, 410, 370, 310,
      260, 230, 215, 225, 250, 290, 360, 420, 450, 430,
      410, 395, 390, 385,
    ],
  },
  'IN-NO': {
    name: 'Northern India Grid',
    baseCurve: [
      640, 630, 620, 615, 630, 670, 710, 680, 610, 540,
      480, 450, 440, 455, 490, 560, 660, 740, 780, 760,
      720, 680, 660, 650,
    ],
  },
};

/**
 * Data provider serving benchmark traces for research demonstrations.
 * Identifies internally as demo/prepared trace data.
 */
export class PreparedTraceDataProvider implements ICarbonDataProvider {
  public name = 'PreparedTraceDataProvider';
  public source = 'PREPARED / DEMO BENCHMARK UNCERTAINTY (Controlled Research Trace)';
  public dataMode: 'live' | 'demo' = 'demo';

  public async getForecast(
    region: string = 'BENCHMARK-RESEARCH',
    horizonHours: number = 24
  ): Promise<CarbonForecastData> {
    const validHorizon = Math.max(1, Math.min(48, Number(horizonHours) || 24));
    const selectedRegion = REGIONAL_PROFILES[region] ? region : 'BENCHMARK-RESEARCH';
    const profile = REGIONAL_PROFILES[selectedRegion];
    const now = new Date();

    const hourlyProfile: HourlyCarbonPoint[] = [];
    for (let idx = 0; idx < validHorizon; idx++) {
      const dt = new Date(now.getTime() + idx * 3600000);
      const intensity = profile.baseCurve[idx % 24];

      // Demo benchmark trace provides illustrative confidence bounds for UI review
      hourlyProfile.push({
        hour: idx,
        offsetHour: idx,
        timestamp: dt.toISOString(),
        predictedCarbon: intensity,
        carbonIntensity: intensity,
        uncertaintyAvailable: true,
        uncertaintyStatus: 'benchmark_demo',
        stdDev: 20,
        uncertainty: 20,
        uncertaintyStdDev: 20,
        confidenceLow: Math.max(10, intensity - 39),
        confidenceHigh: intensity + 39,
      });
    }

    const carbons = hourlyProfile.map((p) => p.predictedCarbon);

    return {
      source: this.source,
      region: selectedRegion,
      regionName: profile.name,
      timestamp: now.toISOString(),
      dataMode: this.dataMode,
      traceVersion: 'v1.0-ucs503-demo-benchmark',
      forecastHorizonHours: validHorizon,
      timeResolution: '60 minutes (Hourly)',
      hourlyProfile,
      averageCarbon: Math.round(carbons.reduce((a, b) => a + b, 0) / carbons.length),
      minCarbon: Math.min(...carbons),
      maxCarbon: Math.max(...carbons),
      uncertaintyStatus: 'benchmark_demo',
    };
  }

  public getAvailableRegions(): Array<{ code: string; name: string }> {
    return Object.entries(REGIONAL_PROFILES).map(([code, meta]) => ({
      code,
      name: meta.name,
    }));
  }
}

/**
 * Live Electricity Maps API provider for production integrations.
 * Default data provider for the CarbonRoute Interactive Prototype.
 */
export class ElectricityMapsDataProvider implements ICarbonDataProvider {
  public name = 'ElectricityMapsDataProvider';
  public source = 'Electricity Maps Live API';
  public dataMode: 'live' | 'demo' = 'live';

  constructor(private apiKey?: string) {}

  public async getForecast(
    region: string = 'US-CAL-CISO',
    horizonHours: number = 24
  ): Promise<CarbonForecastData> {
    const key = (
      this.apiKey ||
      process.env.ELECTRICITY_MAPS_API_KEY ||
      config.electricityMapsApiKey ||
      ''
    ).trim();

    if (!key) {
      throw new Error(
        'Live carbon forecast unavailable: Electricity Maps API key is not configured.'
      );
    }

    const validHorizon = Math.max(1, Math.min(48, Number(horizonHours) || 24));
    const selectedRegion = region ? region.trim() : 'US-CAL-CISO';
    const profile = REGIONAL_PROFILES[selectedRegion];
    const regionName = profile ? profile.name : selectedRegion;

    let response: Response;
    try {
      response = await fetch(
        `https://api.electricitymap.org/v3/carbon-intensity/forecast?zone=${encodeURIComponent(
          selectedRegion
        )}`,
        {
          headers: {
            'auth-token': key,
          },
        }
      );
    } catch (networkErr: any) {
      throw new Error(
        `Live carbon forecast unavailable: Network request failed (${networkErr.message}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Live carbon forecast unavailable: Electricity Maps API responded with HTTP ${response.status} (${response.statusText}).`
      );
    }

    const apiData = (await response.json()) as any;
    if (!apiData || !Array.isArray(apiData.forecast) || apiData.forecast.length === 0) {
      throw new Error(
        'Live carbon forecast unavailable: Electricity Maps returned an empty forecast.'
      );
    }

    const now = new Date();
    const hourlyProfile: HourlyCarbonPoint[] = apiData.forecast
      .slice(0, validHorizon)
      .map((f: any, idx: number) => {
        const dt = f.datetime ? new Date(f.datetime) : new Date(now.getTime() + idx * 3600000);
        const rawIntensity = f.carbonIntensity ?? f.carbon_intensity;
        if (typeof rawIntensity !== 'number' || isNaN(rawIntensity)) {
          throw new Error(
            `Live carbon forecast unavailable: Invalid carbon intensity value at index ${idx}.`
          );
        }

        // Use actual returned hourly forecast value directly (never fallback to baseCurve)
        const intensity = Math.round(rawIntensity);

        // Electricity Maps provides the point carbon-intensity forecast.
        // Forecast uncertainty is a separate quantity that must be estimated empirically from historical forecast errors.
        // In the current prototype milestone, empirical forecast uncertainty calibration is not yet connected to live mode.
        // Therefore uncertainty is explicitly represented as not calibrated with null stdDev (no fake numbers).
        return {
          hour: idx,
          offsetHour: idx,
          timestamp: dt.toISOString(),
          predictedCarbon: intensity,
          carbonIntensity: intensity,
          uncertaintyAvailable: false,
          uncertaintyStatus: 'not_calibrated',
          stdDev: null,
          uncertainty: null,
          uncertaintyStdDev: null,
          confidenceLow: null,
          confidenceHigh: null,
        };
      });

    const carbons = hourlyProfile.map((p) => p.predictedCarbon);

    return {
      source: this.source,
      region: selectedRegion,
      regionName,
      timestamp: now.toISOString(),
      dataMode: this.dataMode,
      traceVersion: 'v3.0-live-api',
      forecastHorizonHours: hourlyProfile.length,
      timeResolution: '60 minutes',
      hourlyProfile,
      averageCarbon: Math.round(carbons.reduce((a, b) => a + b, 0) / carbons.length),
      minCarbon: Math.min(...carbons),
      maxCarbon: Math.max(...carbons),
      uncertaintyStatus: 'not_calibrated',
    };
  }

  public getAvailableRegions(): Array<{ code: string; name: string }> {
    return Object.entries(REGIONAL_PROFILES).map(([code, meta]) => ({
      code,
      name: meta.name,
    }));
  }
}

/**
 * CarbonService dispatcher: ElectricityMapsDataProvider is the DEFAULT provider.
 * PreparedTraceDataProvider is explicitly available when mode === 'demo'.
 * Errors in live mode are NOT suppressed or silently substituted.
 */
export class CarbonService {
  private static liveProvider: ICarbonDataProvider = new ElectricityMapsDataProvider();
  private static preparedProvider: ICarbonDataProvider = new PreparedTraceDataProvider();

  public static getProvider(mode: 'live' | 'demo' = 'live'): ICarbonDataProvider {
    if (mode === 'demo') {
      return this.preparedProvider;
    }
    return this.liveProvider;
  }

  public static async getForecast(
    region: string = 'US-CAL-CISO',
    horizonHours: number = 24,
    mode: 'live' | 'demo' = 'live'
  ): Promise<CarbonForecastData> {
    const provider = this.getProvider(mode);
    return await provider.getForecast(region, horizonHours);
  }

  public static getAvailableRegions(): Array<{ code: string; name: string }> {
    return this.preparedProvider.getAvailableRegions();
  }
}

/**
 * Top-level convenience function matching the specification.
 * Validates region, horizon, and mode.
 */
export async function getForecast(
  region: string = 'US-CAL-CISO',
  horizonHours: number = 24,
  mode: 'live' | 'demo' = 'live'
): Promise<CarbonForecastData> {
  return CarbonService.getForecast(region, horizonHours, mode);
}
