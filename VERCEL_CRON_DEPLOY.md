# Deploy Vercel Cron Job for Auto-Logging

The Vercel cron job is ready to deploy. Here's what you need to do:

## ✅ What's Already Set Up:

1. **API Route**: `app/api/cron/log-sensors/route.ts` - Serverless function
2. **Cron Config**: `vercel.json` - Configured to run twice daily (6 AM and 6 PM)
3. **Dependencies**: `firebase-admin` is installed

**Note:** Vercel's free tier only allows 2 cron jobs per day. For more frequent logging (every 5 minutes), use the Firebase scheduled function instead (`scheduledSensorLogger` in `functions/src/index.ts`).

## 📋 Deployment Steps:

### 1. Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
CRON_SECRET=your-random-secret-string (optional, for manual testing)
```

**Important:**
- Get these from Firebase Console → Project Settings → Service Accounts
- `FIREBASE_PRIVATE_KEY`: Copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Vercel will handle the `\n` newlines automatically

### 2. Deploy to Vercel

```bash
# If using Vercel CLI
vercel --prod

# Or just push to your connected Git branch
git add .
git commit -m "Add Vercel cron job for sensor logging"
git push
```

### 3. Verify Cron Job

After deployment:
1. Go to Vercel Dashboard → Your Project → **Settings** → **Cron Jobs**
2. You should see: `/api/cron/log-sensors` with schedule `0 6,18 * * *` (6 AM and 6 PM daily)
3. Status should be **Active**

### 4. Check Logs

After the scheduled times (6 AM or 6 PM):
1. Go to Vercel Dashboard → **Logs**
2. Filter by `/api/cron/log-sensors`
3. You should see execution logs twice per day

## 🔍 How It Works:

1. **Vercel automatically triggers** the cron job twice daily (6 AM and 6 PM)
2. **Function reads** all devices from Firebase RTDB
3. **Finds associated paddies** using Firestore collection group query
4. **Logs sensor readings** to each paddy's logs collection
5. **Deduplicates** - skips if same values logged within 5 minutes

## ✅ Expected Behavior:

- **Runs twice daily** (6 AM and 6 PM) - Vercel free tier limitation
- **Works 24/7** - even when app is closed
- **Logs to Firestore** at: `users/{userId}/fields/{fieldId}/paddies/{paddyId}/logs`
- **Readings increase** automatically even when you're offline

**For more frequent logging (every 5 minutes):**
- Use the Firebase scheduled function: `scheduledSensorLogger` in `functions/src/index.ts`
- Deploy it with: `firebase deploy --only functions:scheduledSensorLogger`
- This runs every 5 minutes and works independently of Vercel

## 🐛 Troubleshooting:

### Cron job not appearing:
- Check that `vercel.json` is in the root directory
- Verify the path matches: `/api/cron/log-sensors`
- Redeploy after adding `vercel.json`

### Function errors:
- Check Vercel logs for error messages
- Verify environment variables are set correctly
- Check Firebase Admin credentials are valid

### No logs being created:
- Check function logs for errors
- Verify devices exist in RTDB with NPK data
- Ensure paddies have `deviceId` field set
- Check Firestore rules allow writes

### TypeScript errors (during build):
- These are just type warnings, the function will still work
- The build should succeed despite the warnings
- If build fails, check that `firebase-admin` is in dependencies

## 🎯 Success Indicators:

After deployment, you should see:
- Cron job listed in Vercel dashboard
- Logs appearing twice daily (6 AM and 6 PM) in Vercel logs
- Sensor readings increasing in Firestore
- Readings visible in your app's device/field pages

**Recommendation:** For production use, deploy the Firebase scheduled function (`scheduledSensorLogger`) which can run every 5 minutes without limitations. Use the Vercel cron as a backup or for less frequent logging.
