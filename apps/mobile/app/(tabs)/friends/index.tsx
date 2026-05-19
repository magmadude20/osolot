import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { UserRow } from "../../../components/UserRow";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { getMyFriendRequests, getMyFriends } from "../../../lib/api/users";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";
import type { UserSummary } from "@osolot/shared";

export default function FriendsIndexScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [requests, setRequests] = useState<UserSummary[]>([]);
  const [lookup, setLookup] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const [f, r] = await Promise.all([
        getMyFriends(accessToken),
        getMyFriendRequests(accessToken),
      ]);
      setFriends(f);
      setRequests(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  function openLookup() {
    const u = lookup.trim();
    if (u.length < 3) {
      return;
    }
    router.push(`/(tabs)/friends/${encodeURIComponent(u)}`);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.subtitle}>Find user</Text>
        <TextInput
          style={styles.input}
          placeholder="username"
          autoCapitalize="none"
          value={lookup}
          onChangeText={setLookup}
          onSubmitEditing={openLookup}
        />
        <Pressable style={styles.button} onPress={openLookup}>
          <Text style={styles.buttonText}>Look up</Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} /> : null}
      {loading && friends.length === 0 && requests.length === 0 ? (
        <ActivityIndicator />
      ) : null}

      <Text style={styles.subtitle}>Friend requests</Text>
      {requests.length === 0 ? (
        <EmptyState message="No pending requests." />
      ) : (
        requests.map((u) => (
          <UserRow
            key={u.username}
            user={u}
            subtitle="pending_received"
            onPress={() =>
              { router.push(`/(tabs)/friends/${encodeURIComponent(u.username)}`); }
            }
          />
        ))
      )}

      <Text style={styles.subtitle}>Friends</Text>
      {friends.length === 0 ? (
        <EmptyState message="No friends yet." />
      ) : (
        friends.map((u) => (
          <UserRow
            key={u.username}
            user={u}
            onPress={() =>
              { router.push(`/(tabs)/friends/${encodeURIComponent(u.username)}`); }
            }
          />
        ))
      )}
    </ScrollView>
  );
}
