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
import type { GroupDetail } from "@osolot/shared";
import { PostCard } from "../../../components/PostCard";
import {
  deleteGroup,
  deleteMembership,
  getGroup,
  updateMembership,
} from "../../../lib/api/groups";
import { getMyProfile } from "../../../lib/api/users";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useSession();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setError(null);
    try {
      const [g, me] = await Promise.all([
        getGroup(accessToken, id),
        getMyProfile(accessToken),
      ]);
      setGroup(g);
      setMyUsername(me.username);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.centered}>
        <Text>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const summary = group.summary;
  const status = summary.membershipStatus;
  const role = summary.membershipRole;
  const isAdmin = role === "admin";
  const isMod = role === "admin" || role === "moderator";
  const pending = group.members.filter((m) => m.status === "pending");

  async function approveMember(username: string) {
    if (!accessToken || !id) return;
    try {
      await updateMembership(accessToken, id, username, { status: "active" });
      void load();
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function removeMember(username: string) {
    if (!accessToken || !id) return;
    try {
      await deleteMembership(accessToken, id, username);
      void load();
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function setRole(username: string, newRole: "admin" | "moderator" | "member") {
    if (!accessToken || !id) return;
    try {
      await updateMembership(accessToken, id, username, { role: newRole });
      void load();
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{summary.name}</Text>
        <Text style={styles.hint}>{summary.description}</Text>
        <Text style={styles.badge}>
          {summary.visibility} · {summary.admissionType}
        </Text>
        {group.applicationQuestion ? (
          <Text style={styles.hint}>Q: {group.applicationQuestion}</Text>
        ) : null}
      </View>

      {status ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Your membership: {status}</Text>
          {role ? <Text style={styles.hint}>Role: {role}</Text> : null}
          <Pressable
            style={styles.buttonSecondary}
            onPress={() => { router.push(`/(tabs)/groups/${id}/membership`); }}
          >
            <Text style={styles.buttonSecondaryText}>Edit posts I share</Text>
          </Pressable>
          <Pressable
            style={styles.buttonDanger}
            onPress={() => {
              if (myUsername) void removeMember(myUsername);
            }}
          >
            <Text style={styles.buttonDangerText}>Leave group</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.button}
          onPress={() => { router.push(`/(tabs)/groups/${id}/join`); }}
        >
          <Text style={styles.buttonText}>Join group</Text>
        </Pressable>
      )}

      {isAdmin ? (
        <>
          <Pressable
            style={styles.buttonSecondary}
            onPress={() => { router.push(`/(tabs)/groups/${id}/edit`); }}
          >
            <Text style={styles.buttonSecondaryText}>Edit group settings</Text>
          </Pressable>
          <Pressable
            style={styles.buttonDanger}
            onPress={() => {
              Alert.alert("Delete group?", "", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    void (async () => {
                      if (!accessToken || !id) return;
                      await deleteGroup(accessToken, id);
                      router.back();
                    })();
                  },
                },
              ]);
            }}
          >
            <Text style={styles.buttonDangerText}>Delete group</Text>
          </Pressable>
        </>
      ) : null}

      {isMod && pending.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Pending requests</Text>
          {pending.map((m) => (
            <View key={m.user.username} style={{ gap: 6, marginTop: 8 }}>
              <Text>@{m.user.username}</Text>
              <View style={styles.row}>
                <Pressable
                  style={styles.button}
                  onPress={() => void approveMember(m.user.username)}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={styles.buttonDanger}
                  onPress={() => void removeMember(m.user.username)}
                >
                  <Text style={styles.buttonDangerText}>Deny</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.subtitle}>Members</Text>
      {group.members.map((m) => (
        <View key={m.user.username} style={styles.card}>
          <Text>@{m.user.username}</Text>
          <Text style={styles.hint}>
            {m.status} · {m.role}
          </Text>
          {isMod && m.user.username !== myUsername ? (
            <View style={styles.row}>
              {isAdmin ? (
                <>
                  <Pressable onPress={() => void setRole(m.user.username, "admin")}>
                    <Text style={styles.linkText}>Admin</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void setRole(m.user.username, "moderator")}
                  >
                    <Text style={styles.linkText}>Mod</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void setRole(m.user.username, "member")}
                  >
                    <Text style={styles.linkText}>Member</Text>
                  </Pressable>
                </>
              ) : null}
              <Pressable onPress={() => void removeMember(m.user.username)}>
                <Text style={[styles.linkText, { color: "#c00" }]}>Remove</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}

      <Text style={styles.subtitle}>Shared posts</Text>
      {group.sharedPosts.length === 0 ? (
        <Text style={styles.hint}>No shared posts.</Text>
      ) : (
        group.sharedPosts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onPress={() => { router.push(`/(tabs)/posts/${p.id}`); }}
          />
        ))
      )}
    </ScrollView>
  );
}
