import React, { useState, useEffect } from 'react';
import { weatherService } from '../../services/weatherService';
import { WeatherData } from '../../types';
import { KARNATAKA_LOCATIONS } from '../../lib/constants';
import { useLocation } from '../../context/LocationContext';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  RefreshCw,
  Sun
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { district, setLocation } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      const data = await weatherService.getWeatherForDistrict(district);
      setWeather(data);
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [district]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Agricultural Weather & Farm Planning
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            District-level meteorological forecasts calibrated for field spray windows, harvest drying, and rainfall alerts.
          </p>
        </div>

        {/* District Selector */}
        <div className="flex items-center gap-2">
          <select
            value={district}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-700 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-xs"
          >
            {KARNATAKA_LOCATIONS.map((loc) => (
              <option key={loc.district} value={loc.district}>
                {loc.district}
              </option>
            ))}
          </select>

          <button
            onClick={fetchWeather}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-xs"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {weather && (
        <>
          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-800">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                  {weather.district}, {weather.state}
                </span>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl sm:text-6xl font-black">{Math.round(weather.current_temp)}°C</span>
                  <span className="text-base text-emerald-200 capitalize font-medium">{weather.condition}</span>
                </div>
                {weather.feels_like && (
                  <p className="text-xs text-emerald-300">Feels like {Math.round(weather.feels_like)}°C</p>
                )}
              </div>

              <div className="md:col-span-6 grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 text-center">
                  <Droplets className="w-5 h-5 mx-auto text-emerald-300 mb-1" />
                  <span className="text-[10px] text-emerald-200 block">Humidity</span>
                  <span className="text-base font-bold text-white">{weather.humidity}%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 text-center">
                  <CloudRain className="w-5 h-5 mx-auto text-blue-300 mb-1" />
                  <span className="text-[10px] text-emerald-200 block">Rain Chance</span>
                  <span className="text-base font-bold text-white">{weather.rain_probability}%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 text-center">
                  <Wind className="w-5 h-5 mx-auto text-amber-300 mb-1" />
                  <span className="text-[10px] text-emerald-200 block">Wind Speed</span>
                  <span className="text-base font-bold text-white">{weather.wind_speed} km/h</span>
                </div>
              </div>
            </div>

            {/* Farm Planning Alert Box */}
            <div className="mt-6 pt-6 border-t border-emerald-800/80 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/50 space-y-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Agri Advisory & Farm Planning
                </h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                {weather.agricultural_advisory}
              </p>
            </div>
          </div>

          {/* Meteorological Warning Alerts */}
          {weather.alerts && weather.alerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">District Weather Advisory</h4>
                {weather.alerts.map((al, idx) => (
                  <p key={idx} className="text-xs font-medium text-amber-900 mt-0.5">{al}</p>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Forecast Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>7-Day Agricultural Forecast</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weather.forecast.map((day) => (
                <div
                  key={day.date}
                  className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-2"
                >
                  <span className="text-xs font-bold text-gray-800">{day.day_name}</span>
                  <span className="text-[10px] text-gray-400">{day.date.slice(5)}</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">{Math.round(day.max_temp)}°</span>
                    <span className="text-gray-400 ml-1 font-normal">{Math.round(day.min_temp)}°</span>
                  </div>
                  <div className="text-[10px] font-semibold text-blue-600">
                    {day.rain_probability}% rain
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight">{day.condition}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
