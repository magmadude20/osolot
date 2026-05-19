import type { UserSummary } from "@osolot/shared";
import { Pressable, Text, View } from "react-native";
import { styles } from "../lib/styles";

export function UserRow({
  user,
  onPress,
  subtitle,
}: {
  user: UserSummary;
  onPress: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.subtitle}>@{user.username}</Text>
      {subtitle ? <Text style={styles.hint}>{subtitle}</Text> : null}
      {user.friendshipStatus ? (
        <Text style={styles.badge}>{user.friendshipStatus}</Text>
      ) : null}
    </Pressable>
  );
}
