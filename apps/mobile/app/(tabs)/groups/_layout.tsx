import { Stack } from "expo-router";

export default function GroupsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Groups" }} />
      <Stack.Screen name="new" options={{ title: "New group" }} />
      <Stack.Screen name="[id]" options={{ title: "Group" }} />
      <Stack.Screen name="[id]/edit" options={{ title: "Edit group" }} />
      <Stack.Screen name="[id]/join" options={{ title: "Join group" }} />
      <Stack.Screen name="[id]/membership" options={{ title: "My sharing" }} />
    </Stack>
  );
}
