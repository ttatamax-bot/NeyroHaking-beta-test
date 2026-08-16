# Android-сборка «НейроХакинга»

Android-обёртка использует системный `Sensor.TYPE_STEP_COUNTER`, а не
акселерометр браузера. `StepCounterService` запускается как foreground service,
сохраняет базовую отметку и текущий результат в `SharedPreferences`, поэтому
продолжает считать шаги при выключенном экране.

## Сборка

Из корня workspace:

```bash
pnpm --filter @workspace/neurohacking run android:build
```

APK появится в `android/app/build/outputs/apk/debug/app-debug.apk`.

Для публикации нужно подписать release-сборку своим keystore. Перед первым
запуском приложение запросит:

- доступ к физической активности (`ACTIVITY_RECOGNITION`);
- разрешение на уведомления (Android 13+).

На телефонах Xiaomi, Huawei и некоторых других производителей также может
понадобиться отключить оптимизацию батареи для приложения. Это ограничение
системы Android, а не веб-кода.