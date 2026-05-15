import type { UsernameResponse } from "@osolot/shared";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { assertSupabaseConfigured, supabase } from "./lib/supabase";
import {
  deleteUsername,
  getUsername,
  putUsername,
  UsernameTakenError,
} from "./lib/usernameApi";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    try {
      assertSupabaseConfigured();
    } catch (e) {
      Alert.alert("Configuration", String(e));
      setBooting(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooting(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (booting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {session ? (
          <UsernamePanel session={session} />
        ) : (
          <AuthPanel />
        )}
      </ScrollView>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) Alert.alert("Sign in failed", error.message);
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) Alert.alert("Sign up failed", error.message);
    else {
      Alert.alert(
        "Check email",
        "If email confirmation is enabled in Supabase, confirm your address then sign in.",
      );
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
      />
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={signIn}
        disabled={busy}
      >
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
      <Pressable
        style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
        onPress={signUp}
        disabled={busy}
      >
        <Text style={styles.buttonSecondaryText}>Create account</Text>
      </Pressable>
    </View>
  );
}

function UsernamePanel({ session }: { session: Session }) {
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState<UsernameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = session.access_token;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await getUsername(token);
        if (!cancelled) {
          setProfile(p);
          setDraft(p.username ?? "");
        }
      } catch (e) {
        if (!cancelled) Alert.alert("Load failed", String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function save() {
    setSaving(true);
    try {
      const p = await putUsername(token, draft);
      setProfile(p);
      Alert.alert("Saved", "Username updated.");
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

  async function clearUsername() {
    setSaving(true);
    try {
      const p = await deleteUsername(token);
      setProfile(p);
      setDraft("");
      Alert.alert("Cleared", "Username removed.");
    } catch (e) {
      Alert.alert("Clear failed", String(e));
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Username</Text>
      <Text style={styles.hint}>
        Current:{" "}
        <Text style={styles.mono}>
          {profile?.username == null || profile.username === ""
            ? "(none)"
            : profile.username}
        </Text>
      </Text>
      <Text style={styles.label}>New username (3–32 characters, a–z, 0–9, _)</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        value={draft}
        onChangeText={setDraft}
        placeholder="e.g. river_otter"
      />
      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={save}
        disabled={saving}
      >
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
      <Pressable
        style={[styles.buttonSecondary, saving && styles.buttonDisabled]}
        onPress={clearUsername}
        disabled={saving}
      >
        <Text style={styles.buttonSecondaryText}>Clear username</Text>
      </Pressable>
      <Pressable style={styles.linkButton} onPress={signOut}>
        <Text style={styles.linkText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f6f7f9" },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f7f9",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
  hint: {
    fontSize: 14,
    color: "#555",
  },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSecondaryText: { fontSize: 16, color: "#111" },
  linkButton: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: "#3366cc", fontSize: 16 },
});
