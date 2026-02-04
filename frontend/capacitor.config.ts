import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "za.co.quickbudget",
  appName: "QuickBudget",
  webDir: "out",
  server: {
    url: "https://quickbudget.co.za/dashboard",
    cleartext: true,
  },
  plugins: {
    CapacitorAssets: {
      iconSource: "public/images/icon-512.png",
    },
  },
};

export default config;
