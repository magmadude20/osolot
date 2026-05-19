import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { createGroup } from "../../../lib/api/groups";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";
import type { GroupAdmissionType, GroupVisibility } from "@osolot/shared";

export default function NewGroupScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");
  const [admissionType, setAdmissionType] =
    useState<GroupAdmissionType>("open");
  const [applicationQuestion, setApplicationQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const g = await createGroup(accessToken, {
        name,
        description,
        visibility,
        admissionType,
        applicationQuestion,
      });
      router.replace(`/(tabs)/groups/${g.summary.id}`);
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
          <Text style={styles.label}>Unlisted (members only in listings)</Text>
          <Switch
            value={visibility === "unlisted"}
            onValueChange={(v) => setVisibility(v ? "unlisted" : "public")}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Require application to join</Text>
          <Switch
            value={admissionType === "application"}
            onValueChange={(v) =>
              setAdmissionType(v ? "application" : "open")
            }
          />
        </View>
        {admissionType === "application" ? (
          <>
            <Text style={styles.label}>Application question</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={applicationQuestion}
              onChangeText={setApplicationQuestion}
              multiline
            />
          </>
        ) : null}
      </View>
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.buttonText}>Create group</Text>
      </Pressable>
    </ScrollView>
  );
}
