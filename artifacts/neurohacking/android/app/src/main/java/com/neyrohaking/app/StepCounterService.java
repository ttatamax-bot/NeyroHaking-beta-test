package com.neyrohaking.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;

import java.util.function.LongConsumer;

public class StepCounterService extends Service implements SensorEventListener {

    private static final String ACTION_START = "com.neyrohaking.app.STEP_COUNTER_START";
    private static final String ACTION_STOP = "com.neyrohaking.app.STEP_COUNTER_STOP";
    private static final String PREFS = "neuro_step_counter";
    private static final String KEY_RUNNING = "running";
    private static final String KEY_BASELINE = "baseline";
    private static final String KEY_STEPS = "steps";
    private static final String CHANNEL_ID = "step_counter";
    private static final int NOTIFICATION_ID = 4201;

    private static volatile LongConsumer listener;

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private SharedPreferences preferences;

    public static void setListener(@Nullable LongConsumer updateListener) {
        listener = updateListener;
    }

    public static boolean isSupported(Context context) {
        SensorManager manager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        return manager != null && manager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    public static void start(Context context) {
        Intent intent = new Intent(context, StepCounterService.class).setAction(ACTION_START);
        ContextCompat.startForegroundService(context, intent);
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, StepCounterService.class).setAction(ACTION_STOP);
        context.startService(intent);
    }

    public static JSObject status(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE);
        JSObject status = new JSObject();
        status.put("supported", isSupported(context));
        status.put("running", prefs.getBoolean(KEY_RUNNING, false));
        status.put("steps", Math.max(0, prefs.getLong(KEY_STEPS, 0)));
        return status;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager == null
            ? null
            : sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopTracking();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(action)) {
            preferences.edit()
                .putBoolean(KEY_RUNNING, true)
                .putLong(KEY_BASELINE, -1)
                .putLong(KEY_STEPS, 0)
                .apply();
        }

        startForegroundWithNotification();
        registerSensor();
        publish();
        return START_STICKY;
    }

    private void registerSensor() {
        if (sensorManager == null || stepSensor == null) return;
        sensorManager.unregisterListener(this);
        sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
    }

    private void stopTracking() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        preferences.edit().putBoolean(KEY_RUNNING, false).apply();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER || event.values.length == 0) return;

        long sensorValue = (long) event.values[0];
        long baseline = preferences.getLong(KEY_BASELINE, -1);
        if (baseline < 0) {
            baseline = sensorValue;
            preferences.edit().putLong(KEY_BASELINE, baseline).apply();
        }

        long steps = Math.max(0, sensorValue - baseline);
        preferences.edit().putLong(KEY_STEPS, steps).apply();
        publish();
    }

    private void publish() {
        LongConsumer currentListener = listener;
        if (currentListener != null) {
            currentListener.accept(Math.max(0, preferences.getLong(KEY_STEPS, 0)));
        }
    }

    private void startForegroundWithNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("НейроХакинг")
            .setContentText("Шагомер продолжает работать в фоне")
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
            );
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Шагомер",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Уведомление о работе фонового шагомера");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    @Override
    public void onDestroy() {
        stopTracking();
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // START_STICKY lets Android recreate the service after the app task is
        // swiped away; force-stop from system settings still correctly stops it.
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // No action needed for the step counter sensor.
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}