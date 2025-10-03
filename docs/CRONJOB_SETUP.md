# Cron Job Setup for Stats Updates

The stats aggregation needs to run every 5 minutes to keep the `running_totals` table current. Here are three options for setting this up:

## Option 1: GitHub Actions (Recommended - Free)

The GitHub Action is already configured in `.github/workflows/update-stats.yml`.

### Setup:
1. Go to your GitHub repository Settings → Secrets → Actions
2. Add these secrets:
   - `STATS_UPDATE_URL`: Your production URL (e.g., `https://nuclearblastsimulator.com/api/update-stats`)
   - `STATS_API_KEY`: (Optional) An API key for authentication

### Pros:
- ✅ Completely free (2000 minutes/month)
- ✅ Built-in retry logic
- ✅ Easy monitoring via GitHub UI
- ✅ No additional dependencies

### Cons:
- ⚠️ Minimum interval is 5 minutes
- ⚠️ Can have slight delays during GitHub outages

## Option 2: Netlify Scheduled Functions (Requires Pro Plan)

If you have Netlify Pro ($19/month), you can use the scheduled function at `netlify/functions/scheduled-update-stats.js`.

### Setup:
1. Install dependency: `npm install @netlify/functions`
2. Deploy to Netlify
3. Function runs automatically

### Pros:
- ✅ Runs on same infrastructure
- ✅ No external dependencies
- ✅ Better integration with edge functions

### Cons:
- 💰 Requires Netlify Pro plan
- ⚠️ Limited to Netlify's scheduler capabilities

## Option 3: External Cron Service (Free Options Available)

Use a service like:
- **Cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **UptimeRobot** (Can be configured as a monitor)

### Setup Example (cron-job.org):
1. Sign up at https://cron-job.org
2. Create a new cron job:
   - URL: `https://nuclearblastsimulator.com/api/update-stats`
   - Schedule: Every 5 minutes
   - Method: POST
   - Headers: Add any authentication headers

### Pros:
- ✅ Free options available
- ✅ Simple setup
- ✅ Email notifications on failure

### Cons:
- ⚠️ External dependency
- ⚠️ May require authentication setup

## Monitoring

Regardless of which option you choose, monitor the stats updates:

1. **Check Turso Dashboard**: Look for periodic spikes in row reads every 5 minutes
2. **Verify Counter Freshness**: The `/api/counter` endpoint should show `last_hour_count` updating
3. **Set up Alerts**: Configure alerts if updates fail repeatedly

## Manual Trigger

You can manually trigger the stats update at any time:

```bash
curl -X POST https://nuclearblastsimulator.com/api/update-stats
```

## Verification

To verify the cron job is working:

1. Make some detonations on the site
2. Wait 5-10 minutes
3. Check the stats page - the "Last Hour" count should update
4. Check the response from `/api/counter` - fields should be current

## Fallback

If the cron job fails, the system still works but with degraded performance:
- The optimized endpoint still records detonations
- Basic counts remain accurate
- Only aggregated stats (last hour, most popular) become stale

## Recommended Setup

**For production, we recommend using GitHub Actions** as it's:
- Free
- Reliable
- Easy to monitor
- No additional costs or dependencies