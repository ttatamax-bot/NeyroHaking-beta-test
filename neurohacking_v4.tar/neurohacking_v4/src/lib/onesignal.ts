// OneSignal v16 SDK wrappers
// Reference: https://documentation.onesignal.com/docs/web-sdk

// REST API Key for server-side operations
const ONESIGNAL_REST_API_KEY = 'os_v2_app_cixhzi2wx5czvc6wo2ecayylw6bs3ed2cf4efgmpxujhga2uxz6twaoi5d3cyytkuc5kl6rvwcjlxryw5qroewlnvqduuyosoesax3q';
const ONESIGNAL_APP_ID = '122e7ca3-56bf-459a-8bd6-768820630bb7';

declare const window: Window & {
  OneSignal?: any;
  OneSignalDeferred?: ((OneSignal: any) => void | Promise<void>)[];
};

/** Request browser notification permission through OneSignal */
export async function initOneSignal() {
  if (!window.OneSignal) return;
  try {
    await window.OneSignal.Notifications.requestPermission();
  } catch {
    // ignore
  }
}

/** Opt out of push notifications */
export async function unsubscribeOneSignal() {
  if (!window.OneSignal) return;
  try {
    await window.OneSignal.User.PushSubscription.optOut();
  } catch {
    // ignore
  }
}

/** Opt back in to push notifications */
export async function subscribeOneSignal() {
  if (!window.OneSignal) return;
  try {
    await window.OneSignal.User.PushSubscription.optIn();
  } catch {
    // ignore
  }
}

/** Check if the user has granted notification permission */
export async function isOneSignalSubscribed(): Promise<boolean> {
  if (!window.OneSignal) return false;
  try {
    const perm = await window.OneSignal.Notifications.permission;
    return perm === 'granted';
  } catch {
    return false;
  }
}

/** Get the OneSignal subscription ID */
export async function getOneSignalUserId(): Promise<string | null> {
  if (!window.OneSignal) return null;
  try {
    return (await window.OneSignal.User.PushSubscription.id) || null;
  } catch {
    return null;
  }
}

/** Check if the OneSignal SDK is loaded */
export function isOneSignalReady(): boolean {
  return !!window.OneSignal;
}

/** Add a user tag for segmentation */
export async function addTag(key: string, value: string): Promise<void> {
  if (!window.OneSignal) return;
  try {
    await window.OneSignal.User.addTag(key, value);
  } catch {
    // ignore
  }
}

/** Remove a user tag */
export async function removeTag(key: string): Promise<void> {
  if (!window.OneSignal) return;
  try {
    await window.OneSignal.User.removeTag(key);
  } catch {
    // ignore
  }
}

/** Send a push notification via OneSignal REST API */
export async function sendOneSignalNotification(
  title: string,
  message: string,
  filters?: { key: string; value: string }[]
): Promise<boolean> {
  try {
    const body: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, ru: title },
      contents: { en: message, ru: message },
      included_segments: ['Subscribed Users'],
    };

    // If filters provided, use them instead of all subscribed users
    if (filters && filters.length > 0) {
      delete body.included_segments;
      body.filters = filters.map((f) => ({
        field: 'tag',
        key: f.key,
        relation: '=',
        value: f.value,
      }));
    }

    const response = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('OneSignal API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

/** Send reminder notification to users who enabled technique reminders */
export async function sendTechniqueReminder(): Promise<boolean> {
  return sendOneSignalNotification(
    'НейроХакинг',
    'Пора выполнить техники дня! Каждый день — шаг вперёд. ✈️',
    [{ key: 'notifications_enabled', value: 'true' }]
  );
}

/** Send article notification to users who enabled article notifications */
export async function sendArticleNotification(articleTitle: string): Promise<boolean> {
  return sendOneSignalNotification(
    'НейроХакинг — Академия',
    `Вышла новая статья: "${articleTitle}" Откройте приложение для чтения.`,
    [{ key: 'article_notifications', value: 'true' }]
  );
}

/** Send news notification to users who enabled news notifications */
export async function sendNewsNotification(newsTitle: string): Promise<boolean> {
  return sendOneSignalNotification(
    'НейроХакинг — Новости',
    newsTitle,
    [{ key: 'news_notifications', value: 'true' }]
  );
}
