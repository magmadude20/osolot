import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { getGroup, updateGroup } from "../../../../lib/api/groups";
import { useSession } from "../../../../lib/session";
import { styles } from "../../../../lib/styles";
import type { GroupAdmissionType, GroupVisibility } from "@osolot/shared";

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");
  const [admissionType, setAdmissionType] =
    useState<GroupAdmissionType>("open");
  const [applicationQuestion, setApplicationQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      try {
        const g = await getGroup(accessToken, id);
        setName(g.summary.name);
        setDescription(g.summary.description);
        setVisibility(g.summary.visibility);
        setAdmissionType(g.summary.admissionType);
        setApplicationQuestion(g.applicationQuestion);
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
      await updateGroup(accessToken, id, {
        name,
        description,
        visibility,
        admissionType,
        applicationQuestion,
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
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <View style={styles.row}>
          <Text style={styles.label}>Unlisted</Text>
          <Switch
            value={visibility === "unlisted"}
            onValueChange={(v) => setVisibility(v ? "unlisted" : "public")}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Require application</Text>
          <Switch
            value={admissionType === "application"}
            onValueChange={(v) =>
              setAdmissionType(v ? "application" : "open")
            }
          />
        </View>
        <Text style={styles.label}>Application question</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={applicationQuestion}
          onChangeText={setApplicationQuestion}
          multiline
        />
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
