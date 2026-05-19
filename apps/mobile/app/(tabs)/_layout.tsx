import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="posts" options={{ title: "Posts", headerShown: false }} />
      <Tabs.Screen name="groups" options={{ title: "Groups", headerShown: false }} />
      <Tabs.Screen name="friends" options={{ title: "Friends", headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
