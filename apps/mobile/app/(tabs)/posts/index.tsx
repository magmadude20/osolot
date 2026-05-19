import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { PostCard } from "../../../components/PostCard";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { listMyPosts, listPosts } from "../../../lib/api/posts";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";
import type { PostSummary } from "@osolot/shared";

export default function PostsFeedScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [tab, setTab] = useState<"feed" | "mine">("feed");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      setPosts(
        tab === "feed"
          ? await listPosts(accessToken)
          : await listMyPosts(accessToken),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  return (
    <View style={styles.flex}>
      <View style={[styles.segmentRow, { padding: 16, paddingBottom: 0 }]}>
        <Pressable
          style={[styles.segment, tab === "feed" && styles.segmentActive]}
          onPress={() => setTab("feed")}
        >
          <Text style={[styles.segmentText, tab === "feed" && styles.segmentTextActive]}>
            Feed
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, tab === "mine" && styles.segmentActive]}
          onPress={() => setTab("mine")}
        >
          <Text style={[styles.segmentText, tab === "mine" && styles.segmentTextActive]}>
            Mine
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        {error ? <ErrorBanner message={error} /> : null}
        {loading && posts.length === 0 ? (
          <ActivityIndicator />
        ) : posts.length === 0 ? (
          <EmptyState message="No posts yet." />
        ) : (
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onPress={() => router.push(`/(tabs)/posts/${p.id}`)}
            />
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(tabs)/posts/new")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}
