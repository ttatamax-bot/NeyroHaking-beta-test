# OneSignal Push Notifications Setup Guide

## What Was Done

### 1. OneSignal SDK Integration
- **index.html** - OneSignal SDK v16 loaded with App ID
- **sw.js** - OneSignal Service Worker
- **src/lib/onesignal.ts** - API wrappers for push notifications
- **src/pages/notifications.tsx** - Settings synced with OneSignal

### 2. Settings Sync with OneSignal
When user changes settings:
- **notificationsEnabled** → tag `notifications_enabled: true/false`
- **techniqueReminderTime** → tag `reminder_time: 20:00`
- **articleNotificationsEnabled** → tag `article_notifications: true/false`
- **newsNotificationsEnabled** → tag `news_notifications: true/false`

### 3. Server Endpoint for Automated Reminders
**File:** `api/send-reminder.js`

**Usage:**
```bash
curl -X POST https://your-domain.com/api/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"type": "technique", "title": "НейроХакинг", "message": "Пора выполнить техники дня!"}'
```

**Types:**
- `technique` - sends to users with `notifications_enabled: true`
- `article` - sends to users with `article_notifications: true`
- `news` - sends to users with `news_notifications: true`

---

## Setup Steps

### Step 1: Deploy to Vercel
```bash
git add .
git commit -m "Add OneSignal push notifications"
git push origin main
```

### Step 2: Configure OneSignal Dashboard
1. Go to https://app.onesignal.com
2. Select your app
3. Go to **Settings → Web Push**
4. Set **Site URL** to your Vercel domain
5. Save

### Step 3: Set up Automated Reminders (cron-job.org)

**For daily reminders at 20:00:**

1. Go to https://cron-job.org
2. Create free account
3. Click **Create Cronjob**
4. **Title:** `Neurohacking Daily Reminder`
5. **URL:** `https://your-domain.vercel.app/api/send-reminder`
6. **Method:** POST
7. **Headers:**
   ```
   Content-Type: application/json
   ```
8. **Body:**
   ```json
   {
     "type": "technique",
     "title": "НейроХакинг",
     "message": "Пора выполнить техники дня! Каждый день — шаг вперёд. ✈️"
   }
   ```
9. **Schedule:**
   - Select: Daily
   - Time: 20:00 (or your preferred time)
   - Timezone: UTC+3 (Moscow)
10. Save

**For multiple reminder times:**
Create multiple cron jobs with different times (e.g., 9:00, 14:00, 20:00).

---

## How It Works

### User Flow
1. User opens app → goes to Settings → Notifications
2. Enables "Reminders about techniques"
3. Sets time (e.g., 20:00)
4. OneSignal requests browser permission
5. Settings are saved as tags in OneSignal

### Sending Flow
1. Cron job triggers at set time
2. Calls `/api/send-reminder` with type
3. OneSignal sends push to users with matching tag
4. Push arrives even when app is closed
5. User clicks → app opens

---

## Manual Testing

### Test from OneSignal Dashboard
1. Go to https://app.onesignal.com
2. **Messages → New Message**
3. **Title:** `НейроХакинг`
4. **Message:** `Тестовое уведомление`
5. **Audience:** Subscribed Users
6. Click **Send**

### Test from Command Line
```bash
curl -X POST https://api.onesignal.com/notifications?c=push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer os_v2_app_cixhzi2wx5czvc6wo2ecayylw6bs3ed2cf4efgmpxujhga2uxz6twaoi5d3cyytkuc5kl6rvwcjlxryw5qroewlnvqduuyosoesax3q" \
  -d '{
    "app_id": "122e7ca3-56bf-459a-8bd6-768820630bb7",
    "headings": {"en": "НейроХакинг", "ru": "НейроХакинг"},
    "contents": {"en": "Тест!", "ru": "Тест!"},
    "included_segments": ["Subscribed Users"]
  }'
```

---

## Key Credentials

| Key | Value |
|-----|-------|
| App ID | `122e7ca3-56bf-459a-8bd6-768820630bb7` |
| REST API Key | `os_v2_app_cixhzi2wx5czvc6wo2ecayylw6bs3ed2cf4efgmpxujhga2uxz6twaoi5d3cyytkuc5kl6rvwcjlxryw5qroewlnvqduuyosoesax3q` |

---

## Troubleshooting

### Notifications not arriving
1. Check if user is in OneSignal Dashboard → Audience
2. Verify browser permission is granted
3. Check if tags are set correctly
4. Test from OneSignal Dashboard manually

### App not opening on click
1. Check Site URL in OneSignal settings
2. Verify service worker is registered
3. Check browser console for errors

---

## Files Changed

```
index.html                              - OneSignal SDK
public/sw.js                            - OneSignal Worker
src/main.tsx                            - Removed manual SW registration
src/lib/onesignal.ts                    - API wrappers
src/lib/store.tsx                       - Added notification settings
src/pages/notifications.tsx             - Settings UI with OneSignal sync
api/send-reminder.js                    - Server endpoint for reminders
```

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure OneSignal Web Push settings
3. ✅ Set up cron-job.org for daily reminders
4. ✅ Test with real device
5. ✅ Monitor OneSignal Dashboard for delivery stats
