/**
 * Frontend Configuration Instruction
 *
 * This frontend controls an ESP32 motor controller via direct HTTP
 * The ESP32 runs a local WebServer on port 80
 * NO Firebase
 * NO RTDB
 * NO backend server
 * NO authentication
 * Communication is direct browser → ESP32
 *
 * HTTP API
 *
 * Endpoint: /motor
 * Method: GET
 * Query parameters:
 *   cmd: "forward" | "backward" | "stop" | "test"
 *   speed: integer 0–100
 * Example:
 *   http://<ESP32_IP>/motor?cmd=forward&speed=75
 * ESP32 responds with plain text
 * UI must display raw response text
 * One button click = one HTTP request
 * Do not introduce state management, polling, or device abstractions
 *
 * ESP32 is the single source of truth for motor state
 *
 * ---
 * Canonical Frontend Behavior
 *
 * Frontend is stateless
 * No retries
 * No background loops
 * No command queues
 * No syncing
 * Button press sends request and shows response
 *
 * ---
 * The ESP32 is a local actuator, not an IoT cloud device.
 */

import React, { useState } from 'react';
import { Scan, Map, MapPin, Power, Loader2 } from 'lucide-react';

interface ControlPanelProps {
  isScanning: boolean;
  lastScanTime: Date | null;
  scanSuccess: boolean;
  hasSavedBoundary: boolean;
  gpsData: any;
  relayStates: boolean[];
  relayProcessing?: boolean[];
  motorExtended: boolean;
  motorProcessing: boolean;
  onScanNow: () => Promise<void>;
  onOpenBoundaryMap: () => void;
  onViewLocation: () => void;
  onRelayToggle: (index: number) => Promise<void>;
  onMotorToggle: () => Promise<void>;
}

export function ControlPanel(props: ControlPanelProps) {

  // ESP32B Motor Controller (stateless, direct HTTP)
  const [esp32bIp, setEsp32bIp] = useState('192.168.1.45');
  const [motorCmd, setMotorCmd] = useState<'forward' | 'backward' | 'stop' | 'test'>('forward');
  const [motorSpeed, setMotorSpeed] = useState(80);
  const [esp32bResponse, setEsp32bResponse] = useState<string | null>(null);
  const [esp32bLoading, setEsp32bLoading] = useState(false);

  function sendMotorCommand(cmd: 'forward' | 'backward' | 'stop' | 'test', speed: number) {
    setEsp32bLoading(true);
    setEsp32bResponse(null);
    const url = `http://${esp32bIp}/motor?cmd=${cmd}&speed=${speed}`;
    fetch(url)
      .then(res => res.text())
      .then(text => setEsp32bResponse(text))
      .catch(() => setEsp32bResponse('Connection failed'))
      .finally(() => setEsp32bLoading(false));
  }

  const {
    isScanning,
    lastScanTime,
    scanSuccess,
    hasSavedBoundary,
    gpsData,
    relayStates,
    relayProcessing,
    motorExtended,
    motorProcessing,
    onScanNow,
    onOpenBoundaryMap,
    onViewLocation,
    onRelayToggle,
    onMotorToggle,
  } = props;

  const safeRelayProcessing = relayProcessing ?? [false, false, false, false];
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 ui-heading-mono">Device Controls</h3>
      
      {/* Success Banner */}
      {scanSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-800 font-medium">✓ Scan command sent successfully!</span>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Global / Field-level controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Map Boundary */}
          <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">Paddy Boundary</h4>
                <p className="text-xs text-gray-600 mt-1">Field mapping (not tied to ESP32)</p>
              </div>
              <Map className="w-5 h-5 text-blue-600" />
            </div>
            <button
              onClick={onOpenBoundaryMap}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {hasSavedBoundary ? 'Edit Boundary' : 'Map Boundary'}
            </button>
            {hasSavedBoundary && (
              <p className="text-xs text-green-600 mt-2 text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Boundary saved
              </p>
            )}
          </div>
        </div>

        {/* ESP32A - Relay Controller */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">ESP32A – Relay Controller</h4>
              <p className="text-xs text-gray-600 mt-1">Controls irrigation valves and actuators</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Relay 1 */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Relay 1</h4>
                <Power className={`w-5 h-5 ${relayStates[0] ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <button
                onClick={() => onRelayToggle(0)}
                disabled={safeRelayProcessing[0]}
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                  safeRelayProcessing[0]
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : relayStates[0]
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
              >
                {safeRelayProcessing[0] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting...
                  </>
                ) : (
                  relayStates[0] ? 'Turn OFF' : 'Turn ON'
                )}
              </button>
              {safeRelayProcessing[0] && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Waiting for device response...
                </p>
              )}
            </div>
        
            {/* Relay 2 */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Relay 2</h4>
                <Power className={`w-5 h-5 ${relayStates[1] ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <button
                onClick={() => onRelayToggle(1)}
                disabled={safeRelayProcessing[1]}
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                  safeRelayProcessing[1]
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : relayStates[1]
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
              >
                {safeRelayProcessing[1] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting...
                  </>
                ) : (
                  relayStates[1] ? 'Turn OFF' : 'Turn ON'
                )}
              </button>
              {safeRelayProcessing[1] && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Waiting for device response...
                </p>
              )}
            </div>
        
            {/* Relay 3 */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Relay 3</h4>
                <Power className={`w-5 h-5 ${relayStates[2] ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <button
                onClick={() => onRelayToggle(2)}
                disabled={safeRelayProcessing[2]}
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                  safeRelayProcessing[2]
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : relayStates[2]
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
              >
                {safeRelayProcessing[2] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting...
                  </>
                ) : (
                  relayStates[2] ? 'Turn OFF' : 'Turn ON'
                )}
              </button>
              {safeRelayProcessing[2] && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Waiting for device response...
                </p>
              )}
            </div>
        
            {/* Relay 4 */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Relay 4</h4>
                <Power className={`w-5 h-5 ${relayStates[3] ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <button
                onClick={() => onRelayToggle(3)}
                disabled={safeRelayProcessing[3]}
                className={`w-full px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                  safeRelayProcessing[3]
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : relayStates[3]
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
              >
                {safeRelayProcessing[3] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting...
                  </>
                ) : (
                  relayStates[3] ? 'Turn OFF' : 'Turn ON'
                )}
              </button>
              {safeRelayProcessing[3] && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Waiting for device response...
                </p>
              )}
            </div>
          </div>
        </div>


        {/* ESP32B - Motor Controller (stateless, direct HTTP) */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">ESP32B – Motor Controller (Direct HTTP)</h4>
              <p className="text-xs text-gray-600 mt-1">Direct browser → ESP32B. No backend. No state sync.</p>
            </div>
          </div>
          <div className="p-4 border border-blue-200 rounded-lg">
            <div className="mb-2 flex flex-col md:flex-row md:items-center gap-2">
              <label className="text-xs font-medium text-gray-700">ESP32B IP:</label>
              <input
                type="text"
                value={esp32bIp}
                onChange={e => setEsp32bIp(e.target.value)}
                className="border px-2 py-1 rounded w-48 text-sm"
                placeholder="192.168.1.45"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                disabled={esp32bLoading}
                onClick={() => sendMotorCommand('forward', motorSpeed)}
              >Forward</button>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                disabled={esp32bLoading}
                onClick={() => sendMotorCommand('backward', motorSpeed)}
              >Backward</button>
              <button
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                disabled={esp32bLoading}
                onClick={() => sendMotorCommand('stop', 0)}
              >Stop</button>
              <button
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                disabled={esp32bLoading}
                onClick={() => sendMotorCommand('test', 0)}
              >Test</button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-gray-700">Speed:</label>
              <input
                type="number"
                min={0}
                max={100}
                value={motorSpeed}
                onChange={e => setMotorSpeed(Number(e.target.value))}
                className="border px-2 py-1 rounded w-20 text-sm"
              />
              <span className="text-xs text-gray-500">(0–100)</span>
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-700 font-medium mb-1">ESP32B Response:</div>
              <div className="border rounded px-2 py-2 bg-gray-50 min-h-[32px] text-sm">
                {esp32bLoading ? <span className="text-gray-400">Waiting for response...</span> : esp32bResponse || <span className="text-gray-400">No response yet</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ESP32C - NPK Sensor */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">ESP32C – NPK Sensor</h4>
              <p className="text-xs text-gray-600 mt-1">Triggers on-device NPK scan (soil nutrients)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Scan Device */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Scan Device</h4>
                <Scan className="w-5 h-5 text-green-600" />
              </div>
              <button
                onClick={onScanNow}
                disabled={isScanning}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  'Scan Now'
                )}
              </button>
              {lastScanTime && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Last scan: {lastScanTime.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
