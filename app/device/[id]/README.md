# Device Detail Page - Component Structure

This directory contains the refactored Device Detail page, broken down into maintainable, focused components.

## Directory Structure

```
app/device/[id]/
├── components/
│   ├── index.ts                    # Central exports
│   ├── DeviceStatus.tsx            # Device status card
│   ├── SensorReadings.tsx          # NPK & weather sensors display
│   ├── ControlPanel.tsx            # Device controls (scan, relays, restart)
│   ├── DeviceInformation.tsx       # Device info with editable paddy name
│   ├── DataTrends.tsx              # Data trends with chart and table
│   ├── DeviceStatistics.tsx        # 30-day NPK statistics
│   ├── TrendsChart.tsx             # Chart.js line chart component
│   ├── BoundaryMappingModal.tsx    # Full-screen boundary mapping
│   └── LocationModal.tsx           # GPS location modal
├── hooks/
│   └── useDeviceData.ts            # Custom hooks for data fetching
└── page.tsx                        # Main orchestrator component

## Components

### DeviceStatus
Displays the current device connection status, GPS location link, and last update time.

**Props:**
- `deviceId`: Device identifier
- `deviceStatus`: Status object with status, message, color, badge, lastUpdate
- `gpsData`: GPS coordinates object
- `onViewLocation`: Callback to open location modal

---

### SensorReadings
Shows current NPK readings, temperature, humidity, and water level in a grid layout.

**Props:**
- `paddyLiveData`: Live NPK data from Firestore
- `weatherData`: Temperature and humidity data

---

### ControlPanel
Control interface for device operations (scan, boundary mapping, GPS, relays, restart).

**Props:**
- `isScanning`, `lastScanTime`, `scanSuccess`: Scan state
- `hasSavedBoundary`, `gpsData`: Boundary and GPS state
- `relayStates`, `isRestartingDevice`: Control states
- `onScanNow`, `onOpenBoundaryMap`, `onViewLocation`: Action callbacks
- `onRelayToggle`, `onRestartDevice`: Device control callbacks

---

### DeviceInformation
Displays device metadata with editable paddy name.

**Props:**
- `deviceId`, `paddyInfo`, `fieldInfo`: Device and field data
- `gpsData`: GPS coordinates
- `onViewLocation`: Location modal callback
- `onSavePaddyName`: Save callback for paddy name

---

### DataTrends
Historical data viewer with time range selection, chart, table, and pagination.

**Props:**
- `timeRange`: Current time range ('7d' | '30d' | '90d' | 'all')
- `isLoadingLogs`: Loading state
- `historicalLogs`, `realtimeLogs`: Log data arrays
- `currentPage`, `itemsPerPage`: Pagination state
- `onTimeRangeChange`, `onPageChange`, `onScanDevice`: Action callbacks

---

### DeviceStatistics
Displays 30-day NPK statistics (average, min, max, trend).

**Props:**
- `userId`, `fieldId`, `paddyId`, `deviceId`: Identifiers
- `currentNPK`: Current NPK readings object

---

### TrendsChart
Chart.js line chart for visualizing NPK trends over time.

**Props:**
- `logs`: Array of log objects with timestamp and NPK values

---

### BoundaryMappingModal
Full-screen modal for mapping paddy field boundaries with Google Maps integration.

**Props:**
- `show`: Visibility boolean
- `polygonCoords`: Array of lat/lng coordinates
- `mapCenter`: Map center coordinates
- `isSavingBoundary`, `pointAddedNotification`, `hasSavedBoundary`: State flags
- `onClose`, `onAddPoint`, `onRemovePoint`, etc.: Action callbacks
- `calculatePolygonArea`: Area calculation function

---

### LocationModal
Modal displaying detailed GPS information with map integration.

**Props:**
- `show`: Visibility boolean
- `deviceId`: Device identifier
- `gpsData`: GPS data object (lat, lng, alt, hdop, sats, ts)
- `loadingGps`: Loading state
- `onClose`: Close callback
- `formatTimestamp`: Timestamp formatting function

---

## Custom Hooks (useDeviceData.ts)

### useWeatherData(deviceId)
Fetches and monitors weather data from device sensors or Open-Meteo API.

**Returns:** `{ temperature, humidity, loading }`

### useGPSData(deviceId)
Fetches and monitors GPS coordinates with real-time updates.

**Returns:** GPS data object or null

### formatTimestamp(ts)
Utility function to format Unix timestamps.

**Returns:** Formatted date string

---

## Main Page Structure (page.tsx)

The main page component orchestrates all sub-components and manages:
- Authentication and routing
- Data fetching (device info, paddy info, field info)
- Real-time listeners (NPK, GPS, logs)
- State management for all UI interactions
- Navigation (sidebar menu, logout)

### Key Functions in Main Page:
- `getDeviceStatusDisplay()`: Computes device status from live data
- `handleScanNow()`: Sends NPK scan command to device
- `handleRelayToggle(index)`: Controls relay states
- `handleRestartDevice()`: Sends device restart command
- `handleSaveBoundary()`: Saves boundary coordinates to Firestore
- `handleSavePaddyName()`: Updates paddy name in Firestore
- `handleDisconnect()`: Disconnects device from paddy

---

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the app
3. **Testability**: Small components are easier to test
4. **Readability**: Clear separation of concerns
5. **Performance**: Easier to optimize individual components
6. **Collaboration**: Multiple developers can work on different components

---

## Usage Example

```tsx
import {
  DeviceStatus,
  SensorReadings,
  ControlPanel,
  DataTrends
} from './components';

// In your page component
<DeviceStatus
  deviceId={deviceId}
  deviceStatus={deviceStatus}
  gpsData={gpsData}
  onViewLocation={handleViewLocation}
/>

<SensorReadings
  paddyLiveData={paddyLiveData}
  weatherData={weatherData}
/>
```

---

## Future Improvements

- [ ] Add unit tests for each component
- [ ] Implement error boundaries
- [ ] Add loading skeletons for better UX
- [ ] Extract more reusable UI patterns
- [ ] Add TypeScript interfaces to separate file
- [ ] Implement component lazy loading
