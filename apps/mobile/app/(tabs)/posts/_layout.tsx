import { Stack } from "expo-router";

export default function PostsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Posts" }} />
      <Stack.Screen name="new" options={{ title: "New post" }} />
      <Stack.Screen name="[id]" options={{ title: "Post" }} />
      <Stack.Screen name="[id]/edit" options={{ title: "Edit post" }} />
    </Stack>
  );
}
