import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import type { PostDetail } from "@osolot/shared";
import { deletePost, getPost } from "../../../lib/api/posts";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setError(null);
    try {
      setPost(await getPost(accessToken, id));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function onDelete() {
    if (!accessToken || !id) return;
    Alert.alert("Delete post?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deletePost(accessToken, id);
              router.back();
            } catch (e) {
              Alert.alert("Error", String(e));
            }
          })();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centered}>
        <Text>{error ?? "Post not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.badge}>{post.type}</Text>
        <Text style={styles.hint}>@{post.owner.username}</Text>
        <Text style={{ marginTop: 8 }}>{post.description}</Text>
        {post.sharing ? (
          <View style={{ marginTop: 12, gap: 4 }}>
            <Text style={styles.subtitle}>Sharing</Text>
            <Text style={styles.hint}>
              Public: {post.sharing.public ? "yes" : "no"}
            </Text>
            {post.sharing.sharedGroups.map((g) => (
              <Text key={g.id} style={styles.hint}>
                Group: {g.name}
              </Text>
            ))}
            {post.sharing.sharedFriends.map((f) => (
              <Text key={f.username} style={styles.hint}>
                Friend: @{f.username}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <Pressable
        style={styles.button}
        onPress={() => Alert.alert("Coming soon", "Notifications coming soon.")}
      >
        <Text style={styles.buttonText}>Respond</Text>
      </Pressable>

      <Pressable
        style={styles.buttonSecondary}
        onPress={() => router.push(`/(tabs)/posts/${id}/edit`)}
      >
        <Text style={styles.buttonSecondaryText}>Edit</Text>
      </Pressable>

      <Pressable style={styles.buttonDanger} onPress={() => void onDelete()}>
        <Text style={styles.buttonDangerText}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}
