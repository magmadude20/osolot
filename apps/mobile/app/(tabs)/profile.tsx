import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getMyProfile,
  patchMyProfile,
  ProfileNotFoundError,
  UsernameTakenError,
} from "../../lib/api/users";
import { useSession } from "../../lib/session";
import { styles } from "../../lib/styles";
import type { UserProfile } from "@osolot/shared";

export default function ProfileScreen() {
  const { accessToken, signOut } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const p = await getMyProfile(accessToken);
      setProfile(p);
      setUsername(p.username);
      setBio(p.bio);
      setNeedsSetup(false);
    } catch (e) {
      if (e instanceof ProfileNotFoundError) {
        setProfile(null);
        setUsername("");
        setBio("");
        setNeedsSetup(true);
      } else {
        Alert.alert("Load failed", String(e));
      }
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

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const p = await patchMyProfile(accessToken, { username, bio });
      setProfile(p);
      setNeedsSetup(false);
      Alert.alert("Saved", "Profile updated.");
    } catch (e) {
      if (e instanceof UsernameTakenError) {
        Alert.alert("Taken", "That username is already in use.");
      } else {
        Alert.alert("Save failed", String(e));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>My profile</Text>
        {needsSetup ? (
          <Text style={styles.hint}>
            Choose a username to finish setting up your profile.
          </Text>
        ) : profile?.email ? (
          <Text style={styles.hint}>
            {profile.email}
            {profile.emailVerified ? " (verified)" : " (not verified)"}
          </Text>
        ) : null}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. river_otter"
        />
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={bio}
          onChangeText={setBio}
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

      <Pressable style={styles.linkButton} onPress={() => void signOut()}>
        <Text style={styles.linkText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
