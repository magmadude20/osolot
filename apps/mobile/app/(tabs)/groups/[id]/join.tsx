import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { PostPicker } from "../../../../components/PostPicker";
import { getGroup, joinGroup } from "../../../../lib/api/groups";
import { useSession } from "../../../../lib/session";
import { styles } from "../../../../lib/styles";

export default function JoinGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [applicationMessage, setApplicationMessage] = useState("");
  const [sharedPostIds, setSharedPostIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [needsApplication, setNeedsApplication] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      const g = await getGroup(accessToken, id);
      setNeedsApplication(g.summary.admissionType === "application");
      setQuestion(g.applicationQuestion);
    })();
  }, [accessToken, id]);

  async function submit() {
    if (!accessToken || !id) return;
    setSaving(true);
    try {
      await joinGroup(accessToken, id, {
        applicationMessage,
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
      {needsApplication ? (
        <View style={styles.card}>
          {question ? <Text style={styles.hint}>{question}</Text> : null}
          <Text style={styles.label}>Application message</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={applicationMessage}
            onChangeText={setApplicationMessage}
            multiline
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.subtitle}>Posts to share with this group</Text>
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
        onPress={() => void submit()}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {needsApplication ? "Submit application" : "Join"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
