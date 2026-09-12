import { config } from '../config';

export interface HourlyCarbonPoint {
  hour: number;
  offsetHour: number;
  timestamp: string;
  predictedCarbon: number; // gCO2eq/kWh
  carbonIntensity: number; // alias for consistency
  stdDev: number; // Forecast uncertainty standard deviation
  uncertainty: number; // alias
  uncertaintyStdDev: number; // alias
  confidenceLow: number;
  confidenceHigh: number;
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
}

export interface ICarbonDataProvider {
  name: string;
  source: string;
  dataMode: 'live' | 'demo';
  getForecast(region: string, horizonHours?: number): Promise<CarbonForecastData>;
  getAvailableRegions(): Array<{ code: string; name: string }>;
}

// Realistic 24-hour baseline traces representing characteristic regional grid mixes
export const REGIONAL_PROFILES: Record<
  string,
  { name: string; baseCurve: number[]; baseStdDev: number[] }
> = {
  'US-CAL-CISO': {
    name: 'California (CAISO)',
    // Solar duck-curve: high morning/evening carbon, steep clean solar drop during midday hours 10–16
    baseCurve: [
      310, 295, 285, 280, 290, 320, 360, 340, 280, 220,
      170, 150, 140, 145, 160, 190, 260, 350, 390, 370,
      340, 320, 310, 305,
    ],
    baseStdDev: [
      10, 11, 12, 14, 15, 18, 22, 25, 28, 32,
      35, 38, 40, 42, 45, 48, 52, 58, 62, 65,
      68, 70, 72, 75,
    ],
  },
  'US-TEX-ERCO': {
    name: 'Texas (ERCOT)',
    // Overnight wind generation (clean), thermal gas generation peak during late afternoon
    baseCurve: [
      230, 210, 195, 190, 205, 240, 280, 310, 330, 345,
      360, 375, 390, 410, 420, 410, 390, 360, 320, 290,
      270, 250, 240, 235,
    ],
    baseStdDev: [
      12, 13, 15, 16, 18, 22, 26, 30, 34, 38,
      42, 45, 49, 53, 58, 62, 66, 70, 74, 78,
      80, 83, 85, 88,
    ],
  },
  'DE': {
    name: 'Germany (Central Europe)',
    // Mixed solar/wind grid with lignite baseload and industrial daytime demand
    baseCurve: [
      380, 365, 350, 340, 355, 390, 430, 410, 370, 310,
      260, 230, 215, 225, 250, 290, 360, 420, 450, 430,
      410, 395, 390, 385,
    ],
    baseStdDev: [
      15, 16, 18, 20, 22, 26, 30, 35, 40, 44,
      48, 52, 55, 58, 62, 66, 71, 76, 80, 84,
      87, 90, 92, 95,
    ],
  },
  'IN-NO': {
    name: 'Northern India Grid',
    // High thermal baseload with prominent midday solar penetration and steep evening lighting peak
    baseCurve: [
      640, 630, 620, 615, 630, 670, 710, 680, 610, 540,
      480, 450, 440, 455, 490, 560, 660, 740, 780, 760,
      720, 680, 660, 650,
    ],
    baseStdDev: [
      18, 20, 22, 25, 28, 34, 40, 46, 52, 58,
      64, 70, 75, 80, 86, 92, 98, 105, 112, 118,
      122, 126, 130, 135,
    ],
  },
};

/**
 * Clean data provider serving calibrated research benchmark traces.
 * Identifies internally as demo/prepared trace data.
 */
export class PreparedTraceDataProvider implements ICarbonDataProvider {
  public name = 'PreparedTraceDataProvider';
  public source = 'Prepared Carbon Trace (UCS503 Calibration Benchmark)';
  public dataMode: 'live' | 'demo' = 'demo';

  public async getForecast(
    region: string = 'US-CAL-CISO',
    horizonHours: number = 24
  ): Promise<CarbonForecastData> {
    const validHorizon = Math.max(1, Math.min(48, Number(horizonHours) || 24));
    const selectedRegion = REGIONAL_PROFILES[region] ? region : 'US-CAL-CISO';
    const profile = REGIONAL_PROFILES[selectedRegion];
    const now = new Date();

    const hourlyProfile: HourlyCarbonPoint[] = [];
    for (let idx = 0; idx < validHorizon; idx++) {
      const dt = new Date(now.getTime() + idx * 3600000);
      const intensity = profile.baseCurve[idx % 24];
      const baseStd = profile.baseStdDev[idx % 24];
      // Uncertainty dispersion growth over horizon: sigma(t) = sigma_0 * (1 + 0.18 * sqrt(t))
      const stdDev = Math.round(baseStd * (1.0 + 0.18 * Math.sqrt(idx)));
      const confidenceLow = Math.max(10, Math.round(intensity - 1.96 * stdDev));
      const confidenceHigh = Math.round(intensity + 1.96 * stdDev);

      hourlyProfile.push({
        hour: idx,
        offsetHour: idx,
        timestamp: dt.toISOString(),
        predictedCarbon: intensity,
        carbonIntensity: intensity,
        stdDev,
        uncertainty: stdDev,
        uncertaintyStdDev: stdDev,
        confidenceLow,
        confidenceHigh,
      });
    }

    const carbons = hourlyProfile.map((p) => p.predictedCarbon);

    return {
      source: this.source,
      region: selectedRegion,
      regionName: profile.name,
      timestamp: now.toISOString(),
      dataMode: this.dataMode,
      traceVersion: 'v1.0-ucs503-calibrated',
      forecastHorizonHours: validHorizon,
      timeResolution: '60 minutes (Hourly)',
      hourlyProfile,
      averageCarbon: Math.round(carbons.reduce((a, b) => a + b, 0) / carbons.length),
      minCarbon: Math.min(...carbons),
      maxCarbon: Math.max(...carbons),
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
 */
export class ElectricityMapsDataProvider implements ICarbonDataProvider {
  public name = 'ElectricityMapsDataProvider';
  public source = 'Electricity Maps Live API';
  public dataMode: 'live' | 'demo' = 'live';

  constructor(private apiKey: string) {}

  public async getForecast(
    region: string = 'US-CAL-CISO',
    horizonHours: number = 24
  ): Promise<CarbonForecastData> {
    const validHorizon = Math.max(1, Math.min(48, Number(horizonHours) || 24));
    const selectedRegion = REGIONAL_PROFILES[region] ? region : 'US-CAL-CISO';
    const profile = REGIONAL_PROFILES[selectedRegion];

    const response = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/forecast?zone=${encodeURIComponent(
        selectedRegion
      )}`,
      {
        headers: {
          'auth-token': this.apiKey.trim(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Electricity Maps API HTTP error: ${response.status} ${response.statusText}`);
    }

    const apiData = (await response.json()) as any;
    if (!apiData || !Array.isArray(apiData.forecast) || apiData.forecast.length === 0) {
      throw new Error('Electricity Maps API returned empty forecast array');
    }

    const now = new Date();
    const hourlyProfile: HourlyCarbonPoint[] = apiData.forecast
      .slice(0, validHorizon)
      .map((f: any, idx: number) => {
        const dt = new Date(f.datetime || now.getTime() + idx * 3600000);
        const intensity = Math.round(Number(f.carbonIntensity) || profile.baseCurve[idx % 24]);
        const stdDev = Math.round(10 + Math.pow(idx, 1.25) * 2.2);
        return {
          hour: idx,
          offsetHour: idx,
          timestamp: dt.toISOString(),
          predictedCarbon: intensity,
          carbonIntensity: intensity,
          stdDev,
          uncertainty: stdDev,
          uncertaintyStdDev: stdDev,
          confidenceLow: Math.max(10, Math.round(intensity - 1.96 * stdDev)),
          confidenceHigh: Math.round(intensity + 1.96 * stdDev),
        };
      });

    const carbons = hourlyProfile.map((p) => p.predictedCarbon);

    return {
      source: this.source,
      region: selectedRegion,
      regionName: profile.name,
      timestamp: now.toISOString(),
      dataMode: this.dataMode,
      traceVersion: 'v3.0-live-api',
      forecastHorizonHours: hourlyProfile.length,
      timeResolution: '60 minutes',
      hourlyProfile,
      averageCarbon: Math.round(carbons.reduce((a, b) => a + b, 0) / carbons.length),
      minCarbon: Math.min(...carbons),
      maxCarbon: Math.max(...carbons),
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
 * CarbonService dispatcher: Uses Electricity Maps if key is configured,
 * otherwise cleanly delegates to the PreparedTraceDataProvider.
 */
export class CarbonService {
  private static defaultProvider: ICarbonDataProvider = new PreparedTraceDataProvider();

  private static getActiveProvider(): ICarbonDataProvider {
    const apiKey =
      process.env.ELECTRICITY_MAPS_API_KEY || (config as any)?.electricityMapsApiKey;
    if (apiKey && apiKey.trim().length > 5) {
      return new ElectricityMapsDataProvider(apiKey);
    }
    return this.defaultProvider;
  }

  public static async getForecast(
    region: string = 'US-CAL-CISO',
    horizonHours: number = 24
  ): Promise<CarbonForecastData> {
    const provider = this.getActiveProvider();
    try {
      return await provider.getForecast(region, horizonHours);
    } catch (err) {
      console.warn(
        `Active provider (${provider.name}) failed, falling back to PreparedTraceDataProvider:`,
        err
      );
      return await this.defaultProvider.getForecast(region, horizonHours);
    }
  }

  public static getAvailableRegions(): Array<{ code: string; name: string }> {
    return this.defaultProvider.getAvailableRegions();
  }
}

/**
 * Top-level convenience function matching the specification.
 * Validates region and horizon, and never returns undefined.
 */
export async function getForecast(
  region: string = 'US-CAL-CISO',
  horizonHours: number = 24
): Promise<CarbonForecastData> {
  return CarbonService.getForecast(region, horizonHours);
}
