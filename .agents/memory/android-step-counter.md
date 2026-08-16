---
name: Android step counter architecture
description: Web and native step-counting capabilities for the walking technique
---

The deployed web app can use `DeviceMotionEvent` only while the browser page is active. Android background counting requires a native wrapper with `Sensor.TYPE_STEP_COUNTER`, `ACTIVITY_RECOGNITION`, and a foreground service; the web screen should hydrate its count from the native service after returning from the background.

**Why:** Mobile browsers suspend JavaScript and do not expose Android's system step-counter sensor to a web page after the screen locks.

**How to apply:** Keep the browser accelerometer path as a foreground fallback, and use the Capacitor Android bridge/service for background behavior rather than trying to extend the service worker or Wake Lock API.