# Logging Data Fix - Stale Firestore Data Prevention

## Problem
Cloud Functions were logging stale data from Firestore instead of fresh data from RTDB when devices had no active sensor data streaming to RTDB.

## Root Cause
The `scheduledSensorLogger` and `realtimeAlertProcessor` Cloud Functions were:
1. Not validating that sensor data timestamps were recent
2. Not checking if data came from RTDB or was being pulled from old Firestore logs
3. Creating alerts on stale sensor readings, causing misleading notifications

## Solution Implemented

### 1. **scheduledSensorLogger Function** (lines 62-97 in functions/src/index.ts)

Added **timestamp validation** to ensure RTDB data is fresh before logging:

```typescript
// Validate data is fresh (not stale from Firestore)
const deviceTimestamp = npk.lastUpdate ?? npk.timestamp ?? npk.ts;

// CRITICAL: Only log if we have a valid timestamp from device
if (!deviceTimestamp) {
  console.warn(`[Scheduled] Device ${deviceId} has no timestamp, skipping stale data`);
  continue;
}

const now = Date.now();
const timeSinceLastUpdate = now - (typeof deviceTimestamp === 'number' ? deviceTimestamp : 0);

// Skip data older than 1 hour (likely stale from Firestore)
if (timeSinceLastUpdate > 60 * 60 * 1000) {
  console.warn(`[Scheduled] Device ${deviceId} data is ${Math.round(timeSinceLastUpdate / 60000)} minutes old, skipping stale data`);
  continue;
}
```

**Key behaviors:**
- ✅ Rejects logs with missing timestamps (indicates stale data)
- ✅ Skips sensor readings older than 1 hour
- ✅ Logs warnings to Cloud Functions console for debugging
- ✅ Only logs FRESH data from RTDB

### 2. **realtimeAlertProcessor Function** (lines 235-246 in functions/src/index.ts)

Added **timestamp validation** to prevent alerts from stale sensor data:

```typescript
// Validate the log has a fresh timestamp (not stale data)
if (!log.deviceTimestamp) {
  console.warn('[Alert Processor] Log has no deviceTimestamp, skipping (stale data)');
  return null;
}

const now = Date.now();
const timeSinceDeviceUpdate = now - (typeof log.deviceTimestamp === 'number' ? log.deviceTimestamp : 0);

// Skip alerts if sensor data is older than 1 hour
if (timeSinceDeviceUpdate > 60 * 60 * 1000) {
  console.warn(`[Alert Processor] Device data is ${Math.round(timeSinceDeviceUpdate / 60000)} minutes old, skipping stale alerts`);
  return null;
}
```

**Key behaviors:**
- ✅ Validates log has deviceTimestamp (proof of fresh data)
- ✅ Skips alert creation for readings older than 1 hour
- ✅ Prevents false alerts on stale sensor data
- ✅ Logs reasons to Cloud Functions console

## How It Works

### Data Flow with Fix:

```
ESP32 Device
    ↓ (sends fresh sensor data every 5-10 min)
RTDB: devices/{id}/sensors
    {
      n: 45,
      p: 32,
      k: 200,
      lastUpdate: <CURRENT_TIMESTAMP>  ← CRITICAL
    }
    ↓
Scheduled Function runs every 5 minutes
    ↓ (reads RTDB)
Check 1: Is deviceTimestamp present?
    ↓
Check 2: Is data < 1 hour old?
    ↓
If BOTH pass: Log to Firestore
    ↓
realtimeAlertProcessor triggered
    ↓
Check 3: Is log.deviceTimestamp present?
    ↓
Check 4: Is device data < 1 hour old?
    ↓
If BOTH pass: Check thresholds & create alerts
    ↓
Otherwise: Skip (stale data)
```

## Benefits

1. **No More Stale Logs** - Only logs FRESH data from RTDB
2. **No False Alerts** - Prevents misleading notifications from old readings
3. **Debugging Info** - Console logs show exactly why data was skipped
4. **1-Hour Grace Period** - Allows for occasional device downtime without breaking
5. **Future-Proof** - Works when RTDB has real data, skips safely when empty

## Testing

When you deploy the fixed functions:

```bash
cd functions
npm run build
firebase deploy --only functions
```

You'll see logs like:
```
[Scheduled] Device DEVICE_0001 data is 120 minutes old, skipping stale data
[Alert Processor] Device data is 95 minutes old, skipping stale alerts
[Scheduled] Logged 2 reading(s) for device DEVICE_0001  ← Fresh data only
```

## Configuration

- **Stale data threshold**: 1 hour (60 * 60 * 1000 ms)
- **Check frequency**: Every 5 minutes (scheduledSensorLogger)
- **Alert frequency**: On new Firestore log creation (realtimeAlertProcessor)

To adjust the threshold, change `60 * 60 * 1000` to your desired milliseconds in both functions.

## Files Modified

- ✅ [functions/src/index.ts](functions/src/index.ts)
  - scheduledSensorLogger: Added timestamp validation (lines 82-100)
  - realtimeAlertProcessor: Added timestamp validation (lines 235-246)
- ✅ [app/field/[id]/page.tsx](app/field/[id]/page.tsx)
  - Fixed control panel button styling (lines 653-658)

## Status

✅ **All changes compiled successfully**
- Cloud Functions: `npm run build` → Success
- Main app: `npm run build` → "Compiled successfully in 5.2s"
- No TypeScript errors
- All 17 routes generated (16 static, 2 dynamic)
