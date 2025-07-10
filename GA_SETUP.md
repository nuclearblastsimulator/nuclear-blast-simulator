# Google Analytics Setup Instructions

## Setting up Google Analytics 4 (GA4)

1. **Create a Google Analytics 4 Property**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Click "Admin" (gear icon in bottom left)
   - Click "Create Property"
   - Enter your property name (e.g., "Nuclear Blast Simulator")
   - Select your time zone and currency
   - Click "Next" and fill in business details
   - Click "Create"

2. **Get your Measurement ID**
   - In the Property column, click "Data Streams"
   - Click "Add stream" > "Web"
   - Enter your website URL and stream name
   - Click "Create stream"
   - Copy the Measurement ID (starts with "G-")

3. **Configure the Measurement ID**
   - Copy `.env.example` to `.env`
   - Add your Measurement ID to the `.env` file:
     ```
     PUBLIC_GA_MEASUREMENT_ID=G-YOUR-ID-HERE
     ```
   - Note: The `PUBLIC_` prefix is required for Astro to expose the variable to the client
   - Analytics will only load in production builds (`npm run build`)

## Analytics Features

The analytics.js file tracks:

### Page Views
- Automatically tracks all page views
- Tracks client-side navigation

### Simulator Events
- Blast simulations (weapon type, location, detonation type)
- Weapon selections and comparisons
- Location searches (preset cities and custom searches)
- Map interactions and zoom levels
- Effects panel usage and viewing duration
- Zone clicks on the blast radius

### User Engagement
- Power user status (10+ simulations)
- Multiple weapons tested (3+ different weapons)
- Multiple locations tested (3+ different locations)
- Session duration and total simulations per session
- External link clicks (GitHub, license links)

### Debug Mode
When running on localhost, analytics events are logged to the console for debugging.

## Testing Analytics

1. Open your browser's Developer Tools
2. Go to the Console tab
3. Navigate through the site and use the simulator
4. You should see "Analytics Event:" logs for tracked events

## Verifying in Google Analytics

1. Go to your Google Analytics property
2. Click "Reports" > "Realtime"
3. You should see active users and events as you browse the site

## Privacy Considerations

Consider adding a privacy policy and cookie consent banner if required by your jurisdiction (GDPR, CCPA, etc.).