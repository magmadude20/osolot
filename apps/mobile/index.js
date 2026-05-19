import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import "react-native-gesture-handler";

// Required to fix EXPO_ROUTER_APP_ROOT not defined
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
