package com.asterinet.react.bgactions;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;

@SuppressWarnings("WeakerAccess")
public class BackgroundActionsModule extends ReactContextBaseJavaModule {

    private static final String TAG = "RNBackgroundActions";

    private final ReactContext reactContext;

    private final Map<String, Intent> serviceIntents = new HashMap<>();

    public BackgroundActionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return TAG;
    }

    private void sendTaskExpirationEvent(String taskName) {
        WritableMap params = Arguments.createMap();
        params.putString("taskName", taskName);
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("expiration", params);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void start(@NonNull final ReadableMap options, @NonNull final Promise promise) {
        try {
            // Get the task name from options
            String taskName = options.getString("taskName");
            if (taskName == null || taskName.isEmpty()) {
                promise.reject("TASK_NAME_REQUIRED", "Task name is required");
                return;
            }

            // Stop any existing task with this name
            if (serviceIntents.containsKey(taskName)) {
                reactContext.stopService(serviceIntents.get(taskName));
                serviceIntents.remove(taskName);
            }

            // Create the service intent
            Intent serviceIntent = new Intent(reactContext, RNBackgroundActionsTask.class);
            
            // Get the task info from the options
            final BackgroundTaskOptions bgOptions = new BackgroundTaskOptions(reactContext, options);
            serviceIntent.putExtras(bgOptions.getExtras());
            
            // Start the task
            reactContext.startService(serviceIntent);
            
            // Store the intent for later use
            serviceIntents.put(taskName, serviceIntent);
            
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void stop(@NonNull final String taskName, @NonNull final Promise promise) {
        try {
            if (taskName == null || taskName.isEmpty()) {
                // For backward compatibility, stop all services if no task name provided
                for (Intent intent : serviceIntents.values()) {
                    reactContext.stopService(intent);
                }
                serviceIntents.clear();
            } else if (serviceIntents.containsKey(taskName)) {
                // Stop the specific service with this task name
                reactContext.stopService(serviceIntents.get(taskName));
                serviceIntents.remove(taskName);
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }
    
    // For backward compatibility where no task name is provided
    @SuppressWarnings("unused")
    @ReactMethod
    public void stop(@NonNull final Promise promise) {
        try {
            // Stop all running services
            for (Intent intent : serviceIntents.values()) {
                reactContext.stopService(intent);
            }
            serviceIntents.clear();
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void updateNotification(@NonNull final ReadableMap options, @NonNull final Promise promise) {
        // Get the task info from the options
        try {
            String taskName = options.getString("taskName");
            if (taskName == null || taskName.isEmpty()) {
                promise.reject("TASK_NAME_REQUIRED", "Task name is required");
                return;
            }
            
            if (!serviceIntents.containsKey(taskName)) {
                promise.reject("TASK_NOT_RUNNING", "The task is not currently running");
                return;
            }
            
            final BackgroundTaskOptions bgOptions = new BackgroundTaskOptions(reactContext, options);
            final Notification notification = RNBackgroundActionsTask.buildNotification(reactContext, bgOptions);
            final NotificationManager notificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.notify(RNBackgroundActionsTask.SERVICE_NOTIFICATION_ID, notification);
        } catch (Exception e) {
            promise.reject(e);
            return;
        }
        promise.resolve(null);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}