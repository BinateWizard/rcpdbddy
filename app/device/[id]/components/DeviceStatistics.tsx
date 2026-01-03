import React, { useEffect, useState } from 'react';

interface DeviceStatisticsProps {
  userId: string;
  fieldId: string;
  paddyId: string;
  deviceId: string;
  currentNPK?: { n?: number; p?: number; k?: number; timestamp?: number };
}

export function DeviceStatistics({ 
  userId, 
  fieldId, 
  paddyId, 
  deviceId,
  currentNPK 
}: DeviceStatisticsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { getDeviceNPKStatistics } = await import('@/lib/utils/statistics');
        const statistics = await getDeviceNPKStatistics(userId, fieldId, paddyId, deviceId, 30);
        setStats(statistics);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, fieldId, paddyId, deviceId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">NPK Statistics (30 Days)</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">NPK Statistics (30 Days)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nitrogen Stats */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">Nitrogen (N)</h4>
            <span className="text-2xl">🧪</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-blue-700">Current:</span>
              <span className="font-bold text-blue-900">
                {currentNPK?.n ?? '--'} mg/kg
              </span>
            </div>
            {stats.nitrogen.average !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Average:</span>
                  <span className="font-bold text-blue-900">{stats.nitrogen.average.toFixed(1)} mg/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Range:</span>
                  <span className="font-medium text-blue-800">
                    {stats.nitrogen.min.toFixed(1)} - {stats.nitrogen.max.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Trend:</span>
                  <span className={`font-medium ${stats.nitrogen.trend > 0 ? 'text-green-600' : stats.nitrogen.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {stats.nitrogen.trend > 0 ? '↑' : stats.nitrogen.trend < 0 ? '↓' : '→'} 
                    {stats.nitrogen.trend !== 0 ? ` ${Math.abs(stats.nitrogen.trend).toFixed(1)}%` : ' Stable'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Phosphorus Stats */}
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-900">Phosphorus (P)</h4>
            <span className="text-2xl">⚗️</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-purple-700">Current:</span>
              <span className="font-bold text-purple-900">
                {currentNPK?.p ?? '--'} mg/kg
              </span>
            </div>
            {stats.phosphorus.average !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Average:</span>
                  <span className="font-bold text-purple-900">{stats.phosphorus.average.toFixed(1)} mg/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Range:</span>
                  <span className="font-medium text-purple-800">
                    {stats.phosphorus.min.toFixed(1)} - {stats.phosphorus.max.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Trend:</span>
                  <span className={`font-medium ${stats.phosphorus.trend > 0 ? 'text-green-600' : stats.phosphorus.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {stats.phosphorus.trend > 0 ? '↑' : stats.phosphorus.trend < 0 ? '↓' : '→'} 
                    {stats.phosphorus.trend !== 0 ? ` ${Math.abs(stats.phosphorus.trend).toFixed(1)}%` : ' Stable'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Potassium Stats */}
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-orange-900">Potassium (K)</h4>
            <span className="text-2xl">🔬</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-orange-700">Current:</span>
              <span className="font-bold text-orange-900">
                {currentNPK?.k ?? '--'} mg/kg
              </span>
            </div>
            {stats.potassium.average !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-orange-700">Average:</span>
                  <span className="font-bold text-orange-900">{stats.potassium.average.toFixed(1)} mg/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-orange-700">Range:</span>
                  <span className="font-medium text-orange-800">
                    {stats.potassium.min.toFixed(1)} - {stats.potassium.max.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-orange-700">Trend:</span>
                  <span className={`font-medium ${stats.potassium.trend > 0 ? 'text-green-600' : stats.potassium.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {stats.potassium.trend > 0 ? '↑' : stats.potassium.trend < 0 ? '↓' : '→'} 
                    {stats.potassium.trend !== 0 ? ` ${Math.abs(stats.potassium.trend).toFixed(1)}%` : ' Stable'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
