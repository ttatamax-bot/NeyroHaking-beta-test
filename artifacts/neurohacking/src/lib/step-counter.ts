import { Capacitor, registerPlugin, type Plugin, type PluginListenerHandle } from "@capacitor/core";

export interface NativeStepStatus {
  supported: boolean;
  running: boolean;
  steps: number;
}

interface NativeStepCounterPlugin extends Plugin {
  start(): Promise<NativeStepStatus>;
  stop(): Promise<void>;
  getStatus(): Promise<NativeStepStatus>;
  addListener(
    eventName: "stepUpdate",
    listenerFunc: (status: NativeStepStatus) => void,
  ): Promise<PluginListenerHandle>;
}

export const nativeStepCounter = registerPlugin<NativeStepCounterPlugin>("StepCounter");

export function isNativeStepCounter(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}