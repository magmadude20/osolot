import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Required to fix EXPO_ROUTER_APP_ROOT not defined
// https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
