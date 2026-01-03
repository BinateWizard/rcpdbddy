# Quick Start Guide - Using Refactored Components

## Import Components

```tsx
// Import all components at once
import {
  DeviceStatus,
  SensorReadings,
  ControlPanel,
  DeviceInformation,
  DataTrends,
  DeviceStatistics,
  BoundaryMappingModal,
  LocationModal
} from './components';

// Import custom hooks
import { useWeatherData, useGPSData, formatTimestamp } from './hooks/useDeviceData';
```

## Basic Usage in page.tsx

```tsx
export default function DeviceDetail() {
  const deviceId = params.id as string;
  
  // Use custom hooks
  const weatherData = useWeatherData(deviceId);
  const gpsData = useGPSData(deviceId);
  
  // Your existing hooks
  const paddyLiveData = usePaddyLiveData(user?.uid, fieldInfo?.id, paddyInfo?.id);
  
  return (
    <main>
      {/* Device Status Card */}
      <DeviceStatus
        deviceId={deviceId}
        deviceStatus={getDeviceStatusDisplay()}
        gpsData={gpsData}
        onViewLocation={() => setShowLocationModal(true)}
      />
      
      {/* Sensor Readings Grid */}
      <SensorReadings
        paddyLiveData={paddyLiveData}
        weatherData={weatherData}
      />
      
      {/* NPK Statistics */}
      {user && paddyInfo && fieldInfo && (
        <DeviceStatistics
          userId={user.uid}
          fieldId={fieldInfo.id}
          paddyId={paddyInfo.id}
          deviceId={deviceId}
          currentNPK={{
            n: paddyLiveData.data?.nitrogen,
            p: paddyLiveData.data?.phosphorus,
            k: paddyLiveData.data?.potassium,
            timestamp: paddyLiveData.data?.timestamp?.getTime()
          }}
        />
      )}
      
      {/* Control Panel */}
      <ControlPanel
        isScanning={isScanning}
        lastScanTime={lastScanTime}
        scanSuccess={scanSuccess}
        hasSavedBoundary={hasSavedBoundary}
        gpsData={gpsData}
        relayStates={relayStates}
        isRestartingDevice={isRestartingDevice}
        onScanNow={handleScanNow}
        onOpenBoundaryMap={() => setShowBoundaryModal(true)}
        onViewLocation={() => setShowLocationModal(true)}
        onRelayToggle={handleRelayToggle}
        onRestartDevice={handleRestartDevice}
      />
      
      {/* Data Trends with Chart */}
      <DataTrends
        timeRange={timeRange}
        isLoadingLogs={isLoadingLogs}
        historicalLogs={historicalLogs}
        realtimeLogs={realtimeLogs}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onTimeRangeChange={setTimeRange}
        onPageChange={setCurrentPage}
        onScanDevice={handleScanNow}
      />
      
      {/* Device Information */}
      <DeviceInformation
        deviceId={deviceId}
        paddyInfo={paddyInfo}
        fieldInfo={fieldInfo}
        gpsData={gpsData}
        onViewLocation={() => setShowLocationModal(true)}
        onSavePaddyName={handleSavePaddyName}
      />
      
      {/* Boundary Mapping Modal */}
      <BoundaryMappingModal
        show={showBoundaryModal}
        polygonCoords={polygonCoords}
        mapCenter={mapCenter}
        isSavingBoundary={isSavingBoundary}
        pointAddedNotification={pointAddedNotification}
        hasSavedBoundary={hasSavedBoundary}
        onClose={() => setShowBoundaryModal(false)}
        onAddPoint={handleAddPoint}
        onRemovePoint={handleRemovePoint}
        onRemoveLastPoint={handleRemoveLastPoint}
        onClearPolygon={handleClearPolygon}
        onSaveBoundary={handleSaveBoundary}
        calculatePolygonArea={calculatePolygonArea}
      />
      
      {/* Location Modal */}
      <LocationModal
        show={showLocationModal}
        deviceId={deviceId}
        gpsData={gpsData}
        loadingGps={loadingGps}
        onClose={() => setShowLocationModal(false)}
        formatTimestamp={formatTimestamp}
      />
    </main>
  );
}
```

## Handler Functions to Keep in page.tsx

```tsx
// Scan handler
const handleScanNow = async () => {
  setIsScanning(true);
  setScanSuccess(false);
  try {
    const { sendDeviceCommand } = await import('@/lib/utils/deviceCommands');
    await sendDeviceCommand(deviceId, 'ESP32C', 'npk', 'scan', {}, user.uid);
    setLastScanTime(new Date());
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 3000);
  } catch (error) {
    console.error('Error scanning device:', error);
    alert('Failed to send scan command to device');
  } finally {
    setIsScanning(false);
  }
};

// Relay toggle handler
const handleRelayToggle = async (relayIndex: number) => {
  if (!user) return;
  const newState = !relayStates[relayIndex];
  const relayNum = relayIndex + 1;
  
  try {
    const { sendDeviceCommand } = await import('@/lib/utils/deviceCommands');
    await sendDeviceCommand(
      deviceId, 
      'ESP32C', 
      'relay', 
      newState ? 'on' : 'off',
      { relay: relayNum },
      user.uid
    );
    
    const newRelayStates = [...relayStates];
    newRelayStates[relayIndex] = newState;
    setRelayStates(newRelayStates);
    
    alert(`✓ Relay ${relayNum} turned ${newState ? 'ON' : 'OFF'}`);
  } catch (error) {
    console.error('Error toggling relay:', error);
    alert('Failed to toggle relay. Please try again.');
  }
};

// Restart device handler
const handleRestartDevice = async () => {
  if (!user) return;
  const confirmed = confirm('This will restart the device. Connection will be temporarily lost. Continue?');
  if (!confirmed) return;
  
  setIsRestartingDevice(true);
  try {
    const { sendDeviceCommand } = await import('@/lib/utils/deviceCommands');
    await sendDeviceCommand(deviceId, 'ESP32C', 'relay', 'restart', {}, user.uid);
    alert('✓ Device restart command sent. Please wait for the device to reconnect.');
  } catch (error) {
    console.error('Error restarting device:', error);
    alert('Failed to send restart command. Please try again.');
  } finally {
    setIsRestartingDevice(false);
  }
};

// Save paddy name handler
const handleSavePaddyName = async (trimmedName: string) => {
  if (!user || !paddyInfo || !fieldInfo) return;
  
  const paddyRef = doc(db, `users/${user.uid}/fields/${fieldInfo.id}/paddies/${paddyInfo.id}`);
  await updateDoc(paddyRef, { paddyName: trimmedName });
  setPaddyInfo({ ...paddyInfo, paddyName: trimmedName });
};

// Boundary handlers
const handleAddPoint = (lat: number, lng: number) => {
  setPolygonCoords(prev => [...prev, { lat, lng }]);
  setPointAddedNotification(true);
  setTimeout(() => setPointAddedNotification(false), 2000);
};

const handleRemovePoint = (index: number) => {
  setPolygonCoords(prev => prev.filter((_, i) => i !== index));
};

const handleRemoveLastPoint = () => {
  setPolygonCoords(prev => prev.slice(0, -1));
};

const handleClearPolygon = () => {
  setPolygonCoords([]);
};

const calculatePolygonArea = (coords: {lat: number; lng: number}[]) => {
  if (coords.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i].lat * Math.PI / 180;
    const lat2 = coords[j].lat * Math.PI / 180;
    const lng1 = coords[i].lng * Math.PI / 180;
    const lng2 = coords[j].lng * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area * R * R / 2);
  return area;
};

const handleSaveBoundary = async () => {
  if (!user || !fieldInfo || !paddyInfo || polygonCoords.length < 3) return;
  
  setIsSavingBoundary(true);
  try {
    const paddyRef = doc(db, `users/${user.uid}/fields/${fieldInfo.id}/paddies/${paddyInfo.id}`);
    const area = calculatePolygonArea(polygonCoords);
    
    await updateDoc(paddyRef, {
      boundary: {
        coordinates: polygonCoords.map(coord => ({
          lat: parseFloat(coord.lat.toFixed(8)),
          lng: parseFloat(coord.lng.toFixed(8))
        })),
        area: area,
        pointCount: polygonCoords.length,
        updatedAt: new Date().toISOString()
      }
    });
    
    alert(`✓ Paddy boundary saved!\n\n${polygonCoords.length} Points\n${(area / 10000).toFixed(2)} hectares`);
    setHasSavedBoundary(true);
    setShowBoundaryModal(false);
  } catch (error) {
    console.error('Error saving boundary:', error);
    alert('Failed to save boundary. Please try again.');
  } finally {
    setIsSavingBoundary(false);
  }
};

// Device status display
const getDeviceStatusDisplay = () => {
  const hasNPK = paddyLiveData.data && (
    paddyLiveData.data.nitrogen !== undefined || 
    paddyLiveData.data.phosphorus !== undefined || 
    paddyLiveData.data.potassium !== undefined
  );
  
  if (paddyLiveData.loading) {
    return {
      status: 'loading',
      message: 'Loading latest sensor data...',
      color: 'gray',
      badge: 'Loading',
      lastUpdate: 'Loading...'
    };
  }
  
  const isRecent = paddyLiveData.data?.timestamp && 
    (Date.now() - paddyLiveData.data.timestamp.getTime()) < 15 * 60 * 1000;
  
  if (!paddyLiveData.data || !isRecent) {
    return {
      status: 'offline',
      message: 'Device is offline',
      color: 'red',
      badge: 'Offline',
      lastUpdate: paddyLiveData.data?.timestamp?.toLocaleString() || 'No data'
    };
  }
  
  if (!hasNPK) {
    return {
      status: 'sensor-issue',
      message: 'Device connected but sensor readings unavailable',
      color: 'yellow',
      badge: 'Sensor Issue',
      lastUpdate: paddyLiveData.data.timestamp.toLocaleTimeString()
    };
  }
  
  return {
    status: 'ok',
    message: 'All systems operational',
    color: 'green',
    badge: 'Connected',
    lastUpdate: paddyLiveData.data.timestamp.toLocaleTimeString()
  };
};
```

## Component Checklist

When using these components, make sure you have:

- ✅ State variables defined (useState hooks)
- ✅ Handler functions implemented
- ✅ Data fetching hooks active (useEffect)
- ✅ Props passed correctly with proper types
- ✅ Error handling in place
- ✅ Loading states managed

## Tips

1. **Keep handlers in main page** - Components should be presentational
2. **Use custom hooks** - For data fetching logic
3. **Pass callbacks** - Not state setters when possible
4. **Type your props** - Use TypeScript interfaces
5. **Document changes** - Keep README updated

## Need Help?

Refer to:
- [README.md](./README.md) - Full component documentation
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Overview of changes
- Individual component files - Each has clear prop interfaces
