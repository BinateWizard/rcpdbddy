import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin explicitly with RTDB URL for reliability
admin.initializeApp({
  databaseURL: "https://rice-padbuddy-default-rtdb.asia-southeast1.firebasedatabase.app",
});

/**
 * Scheduled function: Auto-log sensor readings every 5 minutes
 * 
 * This runs independently of your Vercel app and works 24/7.
 * It checks all devices in RTDB and logs new readings to Firestore.
 */
export const scheduledSensorLogger = functions.pubsub
  .schedule('*/5 * * * *')  // Cron expression: every 5 minutes
  .timeZone('Asia/Manila')  // Set timezone (adjust if needed)
  .onRun(async (context) => {
    console.log('[Scheduled] Starting sensor logging job...');
    
    const firestore = admin.firestore();
    const database = admin.database();
    
    try {
      // Get all devices from RTDB
      const devicesRef = database.ref('devices');
      const devicesSnapshot = await devicesRef.once('value');
      
      if (!devicesSnapshot.exists()) {
        console.log('[Scheduled] No devices found in RTDB');
        return null;
      }

      const devices = devicesSnapshot.val();
      let totalLogged = 0;

      // Process each device
      for (const [deviceId, deviceData] of Object.entries(devices) as [string, any][]) {
        try {
          // Get NPK data from device
          const npk = deviceData.npk || deviceData.sensors || deviceData.readings;
          
          if (!npk) {
            continue; // Skip devices without sensor data
          }

          // Normalize readings
          const nitrogen = npk.nitrogen ?? npk.n ?? npk.N ?? null;
          const phosphorus = npk.phosphorus ?? npk.p ?? npk.P ?? null;
          const potassium = npk.potassium ?? npk.k ?? npk.K ?? null;
          const deviceTimestamp = npk.lastUpdate ?? npk.timestamp ?? npk.ts ?? Date.now();

          // Skip if no actual readings
          if (nitrogen === null && phosphorus === null && potassium === null) {
            continue;
          }

          // Find paddies associated with this device
          const paddiesSnapshot = await firestore
            .collectionGroup('paddies')
            .where('deviceId', '==', deviceId)
            .get();

          if (paddiesSnapshot.empty) {
            console.log(`[Scheduled] No paddies found for device ${deviceId}`);
            continue;
          }

          // Log to each associated paddy (with deduplication check)
          const logPayload = {
            nitrogen,
            phosphorus,
            potassium,
            deviceTimestamp: deviceTimestamp ?? null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: 'firebase-scheduled',
          };

          const writes: Promise<any>[] = [];
          paddiesSnapshot.forEach((paddyDoc) => {
            const logsCol = paddyDoc.ref.collection('logs');
            
            // Check if we already logged this reading (deduplication)
            writes.push(
              logsCol
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get()
                .then(async (lastLogSnapshot) => {
                  if (!lastLogSnapshot.empty) {
                    const lastLog = lastLogSnapshot.docs[0].data();
                    // Handle Firestore Timestamp properly
                    let lastLogTime = 0;
                    if (lastLog.timestamp) {
                      if (lastLog.timestamp.toDate) {
                        lastLogTime = lastLog.timestamp.toDate().getTime();
                      } else if (lastLog.timestamp.getTime) {
                        lastLogTime = lastLog.timestamp.getTime();
                      } else if (typeof lastLog.timestamp === 'number') {
                        lastLogTime = lastLog.timestamp;
                      }
                    }
                    
                    const currentTime = deviceTimestamp || Date.now();
                    
                    // Skip if same values logged within last 5 minutes
                    if (
                      lastLog.nitrogen === nitrogen &&
                      lastLog.phosphorus === phosphorus &&
                      lastLog.potassium === potassium &&
                      lastLogTime > 0 &&
                      (currentTime - lastLogTime) < 5 * 60 * 1000
                    ) {
                      return null; // Skip duplicate
                    }
                  }
                  
                  // Log the reading
                  return logsCol.add(logPayload);
                })
                .catch((error) => {
                  console.error(`[Scheduled] Error checking/adding log for paddy ${paddyDoc.id}:`, error);
                  return null;
                })
            );
          });

          const results = await Promise.all(writes);
          const successful = results.filter(r => r !== null).length;
          totalLogged += successful;

          if (successful > 0) {
            console.log(`[Scheduled] Logged ${successful} reading(s) for device ${deviceId}`);
          }
        } catch (error: any) {
          console.error(`[Scheduled] Error processing device ${deviceId}:`, error);
        }
      }

      console.log(`[Scheduled] Job completed. Logged ${totalLogged} reading(s) total.`);
      return { success: true, logged: totalLogged };
    } catch (error: any) {
      console.error('[Scheduled] Fatal error:', error);
      console.error('[Scheduled] Error stack:', error.stack);
      throw error; // Re-throw to mark function as failed
    }
  });

// Basic test endpoint remains
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from PadBuddy Cloud Functions!");
});
