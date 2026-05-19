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
import {
  SharingForm,
  type SharingFormValue,
} from "../../../../components/SharingForm";
import { getPost, updatePost } from "../../../../lib/api/posts";
import { getMyFriends, getMyMemberships } from "../../../../lib/api/users";
import { useSession } from "../../../../lib/session";
import { styles } from "../../../../lib/styles";
import type { MembershipSummary, UserSummary } from "@osolot/shared";

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !id) return;
    void (async () => {
      try {
        const [post, m, f] = await Promise.all([
          getPost(accessToken, id),
          getMyMemberships(accessToken),
          getMyFriends(accessToken),
        ]);
        setTitle(post.title);
        setDescription(post.description);
        setType(post.type);
        setMemberships(m);
        setFriends(f);
        if (post.sharing) {
          setSharing({
            public: post.sharing.public,
            shareWithNewGroupsDefault: post.sharing.shareWithNewGroupsDefault,
            shareWithNewFriendsDefault: post.sharing.shareWithNewFriendsDefault,
            sharedGroupIds: post.sharing.sharedGroups.map((g) => g.id),
            sharedFriendUsernames: post.sharing.sharedFriends.map(
              (u) => u.username,
            ),
          });
        }
      } catch (e) {
        Alert.alert("Error", String(e));
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, id, router]);

  async function save() {
    if (!accessToken || !id) return;
    setSaving(true);
    try {
      await updatePost(accessToken, id, {
        type,
        title,
        description,
        public: sharing.public,
        shareWithNewGroupsDefault: sharing.shareWithNewGroupsDefault,
        shareWithNewFriendsDefault: sharing.shareWithNewFriendsDefault,
        sharedGroupIds: sharing.sharedGroupIds,
        sharedFriendUsernames: sharing.sharedFriendUsernames,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.segmentRow}>
          <Pressable
            style={[styles.segment, type === "offer" && styles.segmentActive]}
            onPress={() => { setType("offer"); }}
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
            onPress={() => { setType("request"); }}
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
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}
