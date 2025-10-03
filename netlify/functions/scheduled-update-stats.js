// Netlify Scheduled Function for updating stats
// This runs as a background function on Netlify's infrastructure

const { schedule } = require('@netlify/functions');

// Run every 5 minutes
exports.handler = schedule('*/5 * * * *', async (event) => {
  console.log('Running scheduled stats update...');

  try {
    // Call the update-stats edge function
    const response = await fetch(`${process.env.URL || 'https://nuclearblastsimulator.com'}/api/update-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'scheduled-function',
      },
    });

    if (!response.ok) {
      throw new Error(`Stats update failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Stats updated successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Stats updated successfully',
        timestamp: new Date().toISOString(),
        ...data
      }),
    };
  } catch (error) {
    console.error('Error updating stats:', error);

    // Don't throw - we don't want to retry failed stats updates
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Stats update attempted',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
});