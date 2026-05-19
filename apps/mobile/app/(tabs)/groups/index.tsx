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
import { GroupCard } from "../../../components/GroupCard";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { listGroups } from "../../../lib/api/groups";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";
import type { GroupSummary } from "@osolot/shared";

export default function GroupsListScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      setGroups(await listGroups(accessToken));
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

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        {error ? <ErrorBanner message={error} /> : null}
        {loading && groups.length === 0 ? (
          <ActivityIndicator />
        ) : groups.length === 0 ? (
          <EmptyState message="No groups yet." />
        ) : (
          groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onPress={() => { router.push(`/(tabs)/groups/${g.id}`); }}
            />
          ))
        )}
      </ScrollView>
      <Pressable
        style={styles.fab}
        onPress={() => { router.push("/(tabs)/groups/new"); }}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}
