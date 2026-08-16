package com.neyrohaking.app;

import android.Manifest;
import android.os.Build;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activityRecognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        ),
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class StepCounterPlugin extends Plugin {

    @Override
    public void load() {
        StepCounterService.setListener(steps -> {
            JSObject status = StepCounterService.status(getContext());
            notifyListeners("stepUpdate", status);
        });
    }

    @PluginMethod
    public void start(PluginCall call) {
        List<String> missingAliases = missingPermissionAliases();
        if (!missingAliases.isEmpty()) {
            requestPermissionForAliases(
                missingAliases.toArray(new String[0]),
                call,
                "permissionsCallback"
            );
            return;
        }
        startService(call);
    }

    @PermissionCallback
    public void permissionsCallback(PluginCall call) {
        if (!missingPermissionAliases().isEmpty()) {
            call.reject("Для фонового шагомера нужны разрешения на физическую активность и уведомления.");
            return;
        }
        startService(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        StepCounterService.stop(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(StepCounterService.status(getContext()));
    }

    private void startService(PluginCall call) {
        if (!StepCounterService.isSupported(getContext())) {
            JSObject unsupported = StepCounterService.status(getContext());
            unsupported.put("supported", false);
            call.resolve(unsupported);
            return;
        }

        try {
            StepCounterService.start(getContext());
            call.resolve(StepCounterService.status(getContext()));
        } catch (Exception error) {
            call.reject("Не удалось запустить фоновый шагомер.", error);
        }
    }

    private List<String> missingPermissionAliases() {
        List<String> missing = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
            && getPermissionState("activityRecognition") != PermissionState.GRANTED) {
            missing.add("activityRecognition");
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && getPermissionState("notifications") != PermissionState.GRANTED) {
            missing.add("notifications");
        }
        return missing;
    }
}