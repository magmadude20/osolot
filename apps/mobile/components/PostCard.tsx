import type { PostSummary } from "@osolot/shared";
import { Pressable, Text, View } from "react-native";
import { styles } from "../lib/styles";

export function PostCard({
  post,
  onPress,
}: {
  post: PostSummary;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.subtitle}>{post.title}</Text>
        <Text style={styles.badge}>{post.type}</Text>
      </View>
      <Text style={styles.hint}>@{post.owner.username}</Text>
      {post.sharing?.public ? (
        <Text style={styles.badge}>Public</Text>
      ) : null}
    </Pressable>
  );
}
