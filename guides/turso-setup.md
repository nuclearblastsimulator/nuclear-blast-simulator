# Turso Database Setup for Nuclear Blast Simulator

This guide explains how to set up the Turso database for the detonation counter feature.

## Prerequisites

1. A [Turso](https://turso.tech) account
2. [Turso CLI](https://docs.turso.tech/cli/introduction) installed

## Setup Steps

### 1. Create a Turso Database

```bash
# Login to Turso
turso auth login

# Create a new database
turso db create nuclear-blast-simulator

# Get the database URL
turso db show nuclear-blast-simulator --url

# Create an auth token
turso db tokens create nuclear-blast-simulator
```

### 2. Apply the Database Schema

```bash
# Connect to your database
turso db shell nuclear-blast-simulator

# Copy and paste the contents of turso-schema.sql
# Or use the CLI to execute the schema file:
turso db shell nuclear-blast-simulator < turso-schema.sql
```

### 3. Configure Netlify Environment Variables

In your Netlify dashboard:

1. Go to Site settings > Environment variables
2. Add the following variables:
   - `TURSO_URL`: Your database URL from step 1
   - `TURSO_AUTH_TOKEN`: Your auth token from step 1

### 4. Deploy to Netlify

The edge functions are already configured in `netlify.toml` and will be deployed automatically.

## Testing Locally

To test the edge functions locally:

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Run the development server (edge functions are automatically detected)
netlify dev
```

## API Endpoints

### POST /api/detonate
Records a new detonation event.

Request body:
```json
{
  "weaponId": "little-boy",
  "weaponName": "Little Boy",
  "weaponYieldKt": 15,
  "cityName": "New York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "blastType": "air"
}
```

### GET /api/counter
Returns the current detonation counter and statistics.

Response:
```json
{
  "totalDetonations": 12345,
  "uniqueSessions": 5678,
  "totalYieldMT": 1234.56,
  "hiroshimaEquivalents": 82304
}
```

### GET /api/analytics?type={type}
Returns analytics data. Types: `live`, `cities`, `weapons`, `timeline`, `heatmap`, or omit for all stats.

## Privacy Considerations

The implementation follows privacy-conscious practices:
- No IP addresses are collected
- Session IDs are anonymized
- Location data is rounded to city-level
- No personal information is stored