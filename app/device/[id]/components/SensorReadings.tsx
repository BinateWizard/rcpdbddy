import React from 'react';
import { Activity, Droplets, Zap, Thermometer, Wind, Ruler } from 'lucide-react';

interface RTDBNPKReading {
  N?: number;
  P?: number;
  K?: number;
  areaHa?: number;
  timestamp?: number;
  unit?: string;
}

interface SensorReadingsProps {
  rtdbNpkReading?: RTDBNPKReading | null;
  weatherData: {
    temperature: number | null;
    humidity: number | null;
    loading: boolean;
  };
  npkGoal?: {
    n: string;
    p: string;
    k: string;
  } | null;
}

export function SensorReadings({ rtdbNpkReading, weatherData, npkGoal }: SensorReadingsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-0">
      <h3 className="text-lg font-semibold text-gray-900 ui-heading-mono">Current Readings</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Nitrogen</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {typeof rtdbNpkReading?.N === 'number' ? rtdbNpkReading.N : 0}
            {npkGoal?.n && (
              <span className="text-lg text-blue-800 ml-1">/ {npkGoal.n}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{rtdbNpkReading?.unit || 'kg'}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Phosphorus</span>
            <Droplets className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {typeof rtdbNpkReading?.P === 'number' ? rtdbNpkReading.P : 0}
            {npkGoal?.p && (
              <span className="text-lg text-green-800 ml-1">/ {npkGoal.p}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{rtdbNpkReading?.unit || 'kg'}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Potassium</span>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {typeof rtdbNpkReading?.K === 'number' ? rtdbNpkReading.K : 0}
            {npkGoal?.k && (
              <span className="text-lg text-purple-800 ml-1">/ {npkGoal.k}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{rtdbNpkReading?.unit || 'kg'}</p>
        </div>
        {/* Optionally show area and timestamp */}
        {rtdbNpkReading?.areaHa !== undefined && rtdbNpkReading?.areaHa !== null && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Area</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {rtdbNpkReading.areaHa.toFixed(3)} ha
            </p>
          </div>
        )}
        {rtdbNpkReading?.timestamp && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Timestamp</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {new Date(rtdbNpkReading.timestamp * (rtdbNpkReading.timestamp < 1e12 ? 1000 : 1)).toLocaleString()}
            </p>
          </div>
        )}
        {/* Weather and other cards remain unchanged */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">Temperature</span>
            <Thermometer className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {weatherData.loading
              ? '...'
              : weatherData.temperature !== null
              ? `${Math.round(weatherData.temperature)}°`
              : '--'}
          </p>
          <p className="text-xs text-gray-500 mt-1">°C</p>
        </div>
        <div className="p-4 bg-cyan-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-700">Humidity</span>
            <Wind className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {weatherData.loading
              ? '...'
              : weatherData.humidity !== null
              ? `${Math.round(weatherData.humidity)}%`
              : '--'}
          </p>
          <p className="text-xs text-gray-500 mt-1">%</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-700">Water Level</span>
            <Ruler className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-500 mt-1">cm</p>
        </div>
      </div>
    </div>
  );
}
