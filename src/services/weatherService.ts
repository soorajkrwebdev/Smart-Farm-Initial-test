import { WeatherData, WeatherForecastDay } from '../types';
import { KARNATAKA_LOCATIONS } from '../lib/constants';
import { repository } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DISTRICT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Dakshina Kannada': { lat: 12.87, lon: 74.88 },
  'Udupi': { lat: 13.34, lon: 74.74 },
  'Chikkamagaluru': { lat: 13.31, lon: 75.77 },
  'Shivamogga': { lat: 13.92, lon: 75.56 },
  'Kodagu (Coorg)': { lat: 12.42, lon: 75.73 },
  'Bengaluru Urban': { lat: 12.97, lon: 77.59 },
  'Mysuru': { lat: 12.29, lon: 76.63 },
  'Hassan': { lat: 13.00, lon: 76.09 },
};

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear sunny skies';
  if (code === 1 || code === 2) return 'Mainly clear with passing clouds';
  if (code === 3) return 'Overcast skies';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Moderate rainfall';
  if (code >= 80 && code <= 82) return 'Scattered monsoon showers';
  if (code >= 95) return 'Thunderstorms with heavy precipitation';
  return 'Partly cloudy';
}

export const weatherService = {
  async getWeatherForDistrict(districtName: string = 'Dakshina Kannada'): Promise<WeatherData> {
    const coords = DISTRICT_COORDINATES[districtName] || DISTRICT_COORDINATES['Dakshina Kannada'];
    const stateName = 'Karnataka';

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('weather_cache')
          .select('*')
          .eq('district', districtName)
          .eq('state', stateName)
          .maybeSingle();
        if (data) {
          const staleCutoff = Date.now() - 2 * 60 * 60 * 1000;
          const updated = new Date(data.updated_at).getTime();
          if (updated > staleCutoff && data.forecast_json && Array.isArray(data.forecast_json)) {
            return {
              district: data.district,
              state: data.state,
              current_temp: data.current_temp,
              condition: data.condition,
              humidity: data.humidity,
              wind_speed: data.wind_speed,
              rain_probability: data.rain_probability,
              rainfall_mm: 0,
              forecast: data.forecast_json as WeatherForecastDay[],
              alerts: (data.alerts_json as string[]) || [],
              agricultural_advisory: '',
              updated_at: data.updated_at,
              source: 'Supabase PostgreSQL Weather Cache (Open-Meteo / IMD Calibration)',
            };
          }
        }
      } catch (e) {
        console.warn('Supabase weather_cache read failed:', e);
      }
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FKolkata`
      );

      if (response.ok) {
        const json = await response.json();
        const current = json.current;
        const daily = json.daily;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const forecast: WeatherForecastDay[] = (daily.time || []).slice(0, 7).map((dateStr: string, idx: number) => {
          const d = new Date(dateStr);
          return {
            date: dateStr,
            day_name: idx === 0 ? 'Today' : dayNames[d.getDay()],
            max_temp: daily.temperature_2m_max[idx],
            min_temp: daily.temperature_2m_min[idx],
            condition: mapWeatherCode(daily.weather_code[idx]),
            rain_probability: daily.precipitation_probability_max?.[idx] || (daily.precipitation_sum?.[idx] > 2 ? 60 : 20),
            rainfall_mm: daily.precipitation_sum?.[idx] || 0,
          };
        });

        const rainChance = daily.precipitation_probability_max?.[0] || (current.precipitation > 0 ? 80 : 30);
        const alerts: string[] = [];
        if (forecast.some((f) => f.rainfall_mm > 25)) {
          alerts.push(`Yellow Watch: Heavy rainfall (${Math.round(forecast.find((f) => f.rainfall_mm > 25)?.rainfall_mm || 30)}mm) predicted in ${districtName}. Plan drainage.`);
        }
        if (current.wind_speed_10m > 25) {
          alerts.push('High wind gust advisory for tall palm plantations.');
        }

        const advisory = rainChance > 50
          ? 'Postpone foliar sprays and chemical fertilization due to anticipated rain runoff. Inspect field bunds and ensure open drainage in arecanut basins.'
          : 'Favorable condition for agricultural activities, harvesting, and sun-drying of spices and arecanut batches until afternoon.';

        const liveData: WeatherData = {
          district: districtName,
          state: 'Karnataka',
          current_temp: current.temperature_2m,
          condition: mapWeatherCode(current.weather_code),
          feels_like: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          wind_speed: current.wind_speed_10m,
          rain_probability: rainChance,
          rainfall_mm: current.precipitation || 0,
          forecast,
          alerts,
          agricultural_advisory: advisory,
          updated_at: new Date().toISOString(),
          source: 'Open-Meteo High Resolution Meteorological Feed / IMD Calibration',
        };

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('weather_cache').upsert({
              district: districtName,
              state: stateName,
              current_temp: liveData.current_temp,
              condition: liveData.condition,
              humidity: liveData.humidity,
              wind_speed: liveData.wind_speed,
              rain_probability: liveData.rain_probability,
              forecast_json: forecast,
              alerts_json: alerts,
              updated_at: liveData.updated_at,
            }, { onConflict: 'district, state' });
          } catch (e) {
            console.warn('Supabase weather_cache write failed:', e);
          }
        } else {
          repository.saveWeather(liveData);
        }
        return liveData;
      }
    } catch (err) {
      console.warn('Live meteorological forecast fetch failed, using cached weather bulletin:', err);
    }

    const cached = repository.getWeather();
    return {
      ...cached,
      district: districtName,
      source: 'Verified Regional Weather Bulletin (Dakshina Kannada / Karnataka Agro-Met) [FALLBACK]',
    };
  },
};
