// .netlify/functions/trackingmore-webhook.js

const crypto = require('crypto');

// Get the secret from Netlify's environment variables
const WEBHOOK_SECRET = process.env.TRACKINGMORE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: 'Method Not Allowed',
    };
  }

  // Verify the webhook signature
  const signature = event.headers['x-tmore-signature'];
  const body = event.body;

  if (!signature || !WEBHOOK_SECRET) {
    console.error('Missing signature or secret key.');
    return {
      statusCode: 401,
      body: 'Unauthorized: Missing signature or secret.',
    };
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(body);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    console.error('Invalid webhook signature.');
    return {
      statusCode: 401,
      body: 'Unauthorized: Invalid signature.',
    };
  }

  try {
    const trackingData = JSON.parse(body);

    // Now process the tracking data, as it's a valid request
    console.log('✅ Webhook Signature Verified.');
    console.log('Received TrackingMore Webhook Event:', trackingData);

    // Add your custom logic here (e.g., update a database)
    if (trackingData.status === 'delivered') {
      console.log(`Package ${trackingData.tracking_number} has been delivered!`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook received and verified.' }),
    };

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process webhook' }),
    };
  }
};