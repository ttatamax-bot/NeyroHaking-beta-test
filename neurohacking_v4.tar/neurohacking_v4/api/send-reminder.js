/**
 * OneSignal Push Notification API Endpoint
 * Usage: POST /api/send-reminder
 * Body: { "type": "technique" | "article" | "news", "title": "...", "message": "..." }
 *
 * For automated reminders, use cron-job.org to call this endpoint daily.
 */

const ONESIGNAL_APP_ID = '122e7ca3-56bf-459a-8bd6-768820630bb7';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_cixhzi2wx5czvc6wo2ecayylw6bs3ed2cf4efgmpxujhga2uxz6twaoi5d3cyytkuc5kl6rvwcjlxryw5qroewlnvqduuyosoesax3q';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, title, message } = req.body;

    let filters = [];
    let notificationTitle = title || 'НейроХакинг';
    let notificationMessage = message || 'Пора выполнить техники дня!';

    switch (type) {
      case 'technique':
        filters = [{ field: 'tag', key: 'notifications_enabled', relation: '=', value: 'true' }];
        break;
      case 'article':
        filters = [{ field: 'tag', key: 'article_notifications', relation: '=', value: 'true' }];
        break;
      case 'news':
        filters = [{ field: 'tag', key: 'news_notifications', relation: '=', value: 'true' }];
        break;
      default:
        filters = [{ field: 'tag', key: 'notifications_enabled', relation: '=', value: 'true' }];
    }

    const body = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: notificationTitle, ru: notificationTitle },
      contents: { en: notificationMessage, ru: notificationMessage },
      filters: filters,
    };

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OneSignal API error:', errorText);
      return res.status(500).json({ error: 'Failed to send notification', details: errorText });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
