import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SharingForm,
  type SharingFormValue,
} from "../../../components/SharingForm";
import { createPost } from "../../../lib/api/posts";
import { getMyFriends, getMyMemberships } from "../../../lib/api/users";
import { useSession } from "../../../lib/session";
import { styles } from "../../../lib/styles";
import type { MembershipSummary, UserSummary } from "@osolot/shared";

export default function NewPostScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"offer" | "request">("offer");
  const [sharing, setSharing] = useState<SharingFormValue>({
    public: false,
    shareWithNewGroupsDefault: true,
    shareWithNewFriendsDefault: true,
    sharedGroupIds: [],
    sharedFriendUsernames: [],
  });
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);
  const [friends, setFriends] = useState<UserSummary[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      const [m, f] = await Promise.all([
        getMyMemberships(accessToken),
        getMyFriends(accessToken),
      ]);
      setMemberships(m);
      setFriends(f);
    })();
  }, [accessToken]);

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const post = await createPost(accessToken, {
        type,
        title,
        description,
        public: sharing.public,
        shareWithNewGroupsDefault: sharing.shareWithNewGroupsDefault,
        shareWithNewFriendsDefault: sharing.shareWithNewFriendsDefault,
        sharedGroupIds: sharing.sharedGroupIds,
        sharedFriendUsernames: sharing.sharedFriendUsernames,
      });
      router.replace(`/(tabs)/posts/${post.id}`);
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.segmentRow}>
          <Pressable
            style={[styles.segment, type === "offer" && styles.segmentActive]}
            onPress={() => setType("offer")}
          >
            <Text
              style={[
                styles.segmentText,
                type === "offer" && styles.segmentTextActive,
              ]}
            >
              Offer
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segment, type === "request" && styles.segmentActive]}
            onPress={() => setType("request")}
          >
            <Text
              style={[
                styles.segmentText,
                type === "request" && styles.segmentTextActive,
              ]}
            >
              Request
            </Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.card}>
        <SharingForm
          value={sharing}
          onChange={setSharing}
          memberships={memberships}
          friends={friends}
        />
      </View>

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={() => void save()}
        disabled={saving}
      >
        <Text style={styles.buttonText}>Create post</Text>
      </Pressable>
    </ScrollView>
  );
}
