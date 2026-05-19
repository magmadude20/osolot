import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { PostPicker } from "../../../../components/PostPicker";
import { getMembership, updateMembership } from "../../../../lib/api/groups";
import { getMyProfile } from "../../../../lib/api/users";
import { useSession } from "../../../../lib/session";
import { styles } from "../../../../lib/styles";

export default function GroupMembershipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [sharedPostIds, setSharedPostIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      try {
        const me = await getMyProfile(accessToken);
        const m = await getMembership(accessToken, id, me.username);
        const ids = (m.sharedPosts ?? []).map((p) => p.id);
        setSharedPostIds(ids);
      } catch (e) {
        Alert.alert("Error", String(e));
        router.back();
      }
    })();
  }, [accessToken, id, router]);

  async function save() {
    if (!accessToken || !id) return;
    setSaving(true);
    try {
      const me = await getMyProfile(accessToken);
      await updateMembership(accessToken, id, me.username, {
        sharedPostIds,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Posts shared in this group</Text>
        {accessToken ? (
          <PostPicker
            accessToken={accessToken}
            selectedIds={sharedPostIds}
            onChange={setSharedPostIds}
          />
        ) : null}
      </View>
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}
