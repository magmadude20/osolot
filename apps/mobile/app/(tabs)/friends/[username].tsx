import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { PostSummary, UserDetail } from "@osolot/shared";
import { PostCard } from "../../../components/PostCard";
import { GroupCard } from "../../../components/GroupCard";
import { UserRow } from "../../../components/UserRow";
import { PostPicker } from "../../../components/PostPicker";
import {
  addFriendship,
  getMyProfile,
  getUserDetail,
  removeFriendship,
} from "../../../lib/api/users";
import { getPost, listMyPosts, updatePost } from "../../../lib/api/posts";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<PostSummary[]>([]);
  const [sharePostIds, setSharePostIds] = useState<string[]>([]);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !username) return;
    setError(null);
    try {
      const [d, me, posts] = await Promise.all([
        getUserDetail(accessToken, username),
        getMyProfile(accessToken),
        listMyPosts(accessToken),
      ]);
      setDetail(d);
      setMyUsername(me.username);
      setMyPosts(posts);
      const details = await Promise.all(
        posts.map((p) => getPost(accessToken, p.id)),
      );
      const sharedIds = details
        .filter((p) =>
          p.sharing?.sharedFriends.some((f) => f.username === username),
        )
        .map((p) => p.id);
      setSharePostIds(sharedIds);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, username]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  async function friendshipAction() {
    if (!accessToken || !username || !detail) return;
    const status = detail.friendshipStatus ?? detail.summary.friendshipStatus;
    try {
      if (status === "active") {
        await removeFriendship(accessToken, username);
      } else {
        const msg = await addFriendship(accessToken, username);
        Alert.alert("Success", msg);
        if (status === "pending_received") {
          setShowSharePicker(true);
        }
      }
      void load();
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function saveSharedPosts() {
    if (!accessToken || !username) return;
    try {
      for (const post of myPosts) {
        const full = await getPost(accessToken, post.id);
        const current = full.sharing?.sharedFriends.map((f) => f.username) ?? [];
        const shouldInclude = sharePostIds.includes(post.id);
        const hasUser = current.includes(username);
        if (shouldInclude === hasUser) continue;

        let next = current;
        if (shouldInclude && !hasUser) {
          next = [...current, username];
        } else if (!shouldInclude && hasUser) {
          next = current.filter((u) => u !== username);
        }

        await updatePost(accessToken, post.id, {
          sharedFriendUsernames: next,
          public: full.sharing?.public,
          shareWithNewGroupsDefault: full.sharing?.shareWithNewGroupsDefault,
          shareWithNewFriendsDefault: full.sharing?.shareWithNewFriendsDefault,
          sharedGroupIds: full.sharing?.sharedGroups.map((g) => g.id),
        });
      }
      Alert.alert("Saved", "Updated post sharing.");
      setShowSharePicker(false);
      void load();
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centered}>
        <Text>{error ?? "User not found"}</Text>
      </View>
    );
  }

  const status = detail.friendshipStatus ?? detail.summary.friendshipStatus;
  const isSelf = myUsername === username;

  let actionLabel = "Add friend";
  if (status === "active") actionLabel = "Remove friend";
  else if (status === "pending_sent") actionLabel = "Request sent";
  else if (status === "pending_received") actionLabel = "Accept request";

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>@{username}</Text>
        {detail.bio ? <Text style={styles.hint}>{detail.bio}</Text> : null}
        {status ? <Text style={styles.badge}>{status}</Text> : null}
      </View>

      {!isSelf ? (
        <Pressable
          style={styles.button}
          onPress={() => void friendshipAction()}
          disabled={status === "pending_sent"}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}

      {!isSelf && status === "active" ? (
        <>
          <Pressable
            style={styles.buttonSecondary}
            onPress={() => setShowSharePicker((v) => !v)}
          >
            <Text style={styles.buttonSecondaryText}>
              {showSharePicker ? "Hide" : "Edit"} posts I share with them
            </Text>
          </Pressable>
          {showSharePicker && accessToken ? (
            <View style={styles.card}>
              <PostPicker
                accessToken={accessToken}
                selectedIds={sharePostIds}
                onChange={setSharePostIds}
              />
              <Pressable style={styles.button} onPress={() => void saveSharedPosts()}>
                <Text style={styles.buttonText}>Save sharing</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={styles.subtitle}>Mutual groups</Text>
      {detail.mutualGroups.length === 0 ? (
        <Text style={styles.hint}>None</Text>
      ) : (
        detail.mutualGroups.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            onPress={() => router.push(`/(tabs)/groups/${g.id}`)}
          />
        ))
      )}

      <Text style={styles.subtitle}>Mutual friends</Text>
      {detail.mutualFriends.length === 0 ? (
        <Text style={styles.hint}>None</Text>
      ) : (
        detail.mutualFriends.map((u) => (
          <UserRow
            key={u.username}
            user={u}
            onPress={() =>
              router.push(`/(tabs)/friends/${encodeURIComponent(u.username)}`)
            }
          />
        ))
      )}

      <Text style={styles.subtitle}>Posts they share with you</Text>
      {detail.postsSharedWithMe.length === 0 ? (
        <Text style={styles.hint}>None</Text>
      ) : (
        detail.postsSharedWithMe.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onPress={() => router.push(`/(tabs)/posts/${p.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}
