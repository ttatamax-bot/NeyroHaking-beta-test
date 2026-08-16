import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.neyrohaking.app",
  appName: "НейроХакинг",
  webDir: "dist/public",
  android: {
    allowMixedContent: false,
  },
};

export default config;