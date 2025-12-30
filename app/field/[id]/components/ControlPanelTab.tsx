'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Zap, Moon, RotateCcw, Settings, CheckCircle, TrendingUp } from 'lucide-react';

// Helper function to check device status
function getDeviceStatus(paddy: any, deviceReadings: any[]) {
  const deviceReading = deviceReadings.find(r => r.deviceId === paddy.deviceId);
  
  if (!deviceReading) {
    return {
      status: 'offline',
      message: 'Device is offline. Check power supply and network connection.',
      color: 'red',
      badge: 'Offline'
    };
  }
  
  const deviceStatus = deviceReading.status || 'disconnected';
  const hasNPK = deviceReading.npk && (
    deviceReading.npk.n !== undefined || 
    deviceReading.npk.p !== undefined || 
    deviceReading.npk.k !== undefined
  );
  
  let hasRecentNPK = false;
  if (deviceReading.npk?.timestamp) {
    const npkTimestamp = deviceReading.npk.timestamp;
    const npkTime = npkTimestamp < 10000000000 ? npkTimestamp * 1000 : npkTimestamp;
    const timeSinceNPK = Date.now() - npkTime;
    hasRecentNPK = timeSinceNPK < 10 * 60 * 1000;
  }
  
  const isOnline = deviceStatus === 'connected' || 
                   deviceStatus === 'alive' || 
                   hasRecentNPK;
  
  if (!isOnline) {
    return {
      status: 'offline',
      message: 'Device is offline. Check power supply and network connection.',
      color: 'red',
      badge: 'Offline'
    };
  }
  
  if (isOnline && !hasNPK) {
    return {
      status: 'sensor-issue',
      message: 'Device is online but sensors are not reporting data. Check sensor connections.',
      color: 'yellow',
      badge: 'Sensor Issue'
    };
  }
  
  return {
    status: 'ok',
    message: 'Device and sensors are working properly.',
    color: 'green',
    badge: 'Connected'
  };
}

interface ControlPanelTabProps {
  paddies: any[];
  deviceReadings: any[];
  fieldId: string;
}

export function ControlPanelTab({ paddies, deviceReadings, fieldId }: ControlPanelTabProps) {
  const { user } = useAuth();
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionResults, setActionResults] = useState<{[deviceId: string]: {status: string; message: string; timestamp: number}}>({});
  const [customCommand, setCustomCommand] = useState('');

  const toggleDeviceSelection = (paddyId: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paddyId)) {
        newSet.delete(paddyId);
      } else {
        newSet.add(paddyId);
      }
      return newSet;
    });
  };

  const selectAllDevices = () => {
    setSelectedDevices(new Set(paddies.map(p => p.id)));
  };

  const deselectAllDevices = () => {
    setSelectedDevices(new Set());
  };

  const executeAction = async (action: string, timeout: number = 15000) => {
    const selectedPaddies = paddies.filter(p => selectedDevices.has(p.id));
    
    if (selectedPaddies.length === 0) {
      alert('Please select at least one device');
      return;
    }

    setIsExecuting(true);
    setActionResults({});

    try {
      const { executeDeviceAction } = await import('@/lib/utils/deviceActions');
      
      const promises = selectedPaddies.map(async (paddy) => {
        try {
          await executeDeviceAction(paddy.deviceId, action, timeout);
          return {
            deviceId: paddy.deviceId,
            paddyId: paddy.id,
            status: 'success',
            message: `✓ ${action} completed successfully`
          };
        } catch (err: any) {
          return {
            deviceId: paddy.deviceId,
            paddyId: paddy.id,
            status: 'error',
            message: `✗ ${err.message || 'Action failed'}`
          };
        }
      });

      const results = await Promise.all(promises);
      const newResults: {[deviceId: string]: {status: string; message: string; timestamp: number}} = {};
      
      results.forEach(result => {
        newResults[result.paddyId] = {
          status: result.status,
          message: result.message,
          timestamp: Date.now()
        };
      });

      setActionResults(newResults);

      setTimeout(() => {
        setActionResults({});
      }, 5000);
    } catch (error: any) {
      console.error('Action execution error:', error);
      alert('Failed to execute action');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleScan = () => executeAction('scan', 15000);
  const handleCalibrate = () => executeAction('calibrate', 30000);
  const handleReset = () => {
    if (confirm('Are you sure you want to reset the selected devices? This will restart them.')) {
      executeAction('reset', 10000);
    }
  };
  const handleSleep = () => executeAction('sleep', 5000);
  const handleWake = () => executeAction('wake', 5000);

  const handleCustomCommand = async () => {
    if (!customCommand.trim()) {
      alert('Please enter a command');
      return;
    }
    await executeAction(customCommand.trim(), 15000);
    setCustomCommand('');
  };

  return (
    <div className="space-y-6">
      {/* Device Selection */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Select Devices</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAllDevices}
              className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all"
            >
              Select All
            </button>
            <button
              onClick={deselectAllDevices}
              className="text-sm px-3 py-1 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {paddies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No devices available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paddies.map(paddy => {
              const isSelected = selectedDevices.has(paddy.id);
              const deviceStatus = getDeviceStatus(paddy, deviceReadings);
              const hasResult = actionResults[paddy.id];

              return (
                <div
                  key={paddy.id}
                  onClick={() => toggleDeviceSelection(paddy.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{paddy.paddyName}</p>
                        <p className="text-xs text-gray-500">{paddy.deviceId}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deviceStatus.color === 'green' ? 'bg-green-100 text-green-700' :
                      deviceStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {deviceStatus.badge}
                    </span>
                  </div>

                  {hasResult && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      hasResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hasResult.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedDevices.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {selectedDevices.size} device{selectedDevices.size > 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={handleScan}
            disabled={isExecuting || selectedDevices.size === 0}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Scan NPK</span>
            <span className="text-xs text-gray-600">~15s</span>
          </button>

          <button
            onClick={handleCalibrate}
            disabled={isExecuting || selectedDevices.size === 0}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Calibrate</span>
            <span className="text-xs text-gray-600">~30s</span>
          </button>

          <button
            onClick={handleWake}
            disabled={isExecuting || selectedDevices.size === 0}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-8 w-8 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Wake Up</span>
            <span className="text-xs text-gray-600">~5s</span>
          </button>

          <button
            onClick={handleSleep}
            disabled={isExecuting || selectedDevices.size === 0}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Moon className="h-8 w-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Sleep</span>
            <span className="text-xs text-gray-600">~5s</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isExecuting || selectedDevices.size === 0}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-8 w-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Reset</span>
            <span className="text-xs text-gray-600">~10s</span>
          </button>

          <button
            disabled={true}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl opacity-60 cursor-not-allowed"
          >
            <Settings className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Config</span>
            <span className="text-xs text-gray-400">Soon</span>
          </button>
        </div>

        {isExecuting && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-700 font-medium">Executing action...</span>
          </div>
        )}
      </div>

      {/* Custom Command */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Command</h2>
        <p className="text-sm text-gray-600 mb-4">
          Send a custom command to selected devices. Use with caution.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder="Enter command (e.g., scan, calibrate, reset)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isExecuting || selectedDevices.size === 0}
          />
          <button
            onClick={handleCustomCommand}
            disabled={isExecuting || selectedDevices.size === 0 || !customCommand.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      {/* Device Status Overview */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Device Status Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-600">
              {paddies.filter(p => getDeviceStatus(p, deviceReadings).status === 'ok').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Online</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {paddies.filter(p => getDeviceStatus(p, deviceReadings).status === 'sensor-issue').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Issues</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-red-600">
              {paddies.filter(p => getDeviceStatus(p, deviceReadings).status === 'offline').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Offline</p>
          </div>
        </div>
      </div>
    </div>
  );
}
