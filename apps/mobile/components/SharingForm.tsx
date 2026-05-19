import type { MembershipSummary, UserSummary } from "@osolot/shared";
import { Pressable, Switch, Text, View } from "react-native";
import { styles } from "../lib/styles";

export interface SharingFormValue {
  public: boolean;
  shareWithNewGroupsDefault: boolean;
  shareWithNewFriendsDefault: boolean;
  sharedGroupIds: string[];
  sharedFriendUsernames: string[];
}

export function SharingForm({
  value,
  onChange,
  memberships,
  friends,
}: {
  value: SharingFormValue;
  onChange: (v: SharingFormValue) => void;
  memberships: MembershipSummary[];
  friends: UserSummary[];
}) {
  const activeGroups = memberships.filter(
    (m) => m.status === "active",
  );

  function toggleGroup(groupId: string) {
    const ids = value.sharedGroupIds.includes(groupId)
      ? value.sharedGroupIds.filter((id) => id !== groupId)
      : [...value.sharedGroupIds, groupId];
    onChange({ ...value, sharedGroupIds: ids });
  }

  function toggleFriend(username: string) {
    const names = value.sharedFriendUsernames.includes(username)
      ? value.sharedFriendUsernames.filter((u) => u !== username)
      : [...value.sharedFriendUsernames, username];
    onChange({ ...value, sharedFriendUsernames: names });
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        <Text style={styles.label}>Public</Text>
        <Switch
          value={value.public}
          onValueChange={(public_) => onChange({ ...value, public: public_ })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Share with new groups by default</Text>
        <Switch
          value={value.shareWithNewGroupsDefault}
          onValueChange={(shareWithNewGroupsDefault) =>
            onChange({ ...value, shareWithNewGroupsDefault })
          }
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Share with new friends by default</Text>
        <Switch
          value={value.shareWithNewFriendsDefault}
          onValueChange={(shareWithNewFriendsDefault) =>
            onChange({ ...value, shareWithNewFriendsDefault })
          }
        />
      </View>

      <Text style={styles.subtitle}>Share with groups</Text>
      {activeGroups.length === 0 ? (
        <Text style={styles.hint}>No active group memberships.</Text>
      ) : (
        activeGroups.map((m) => {
          const id = m.group.id;
          const checked = value.sharedGroupIds.includes(id);
          return (
            <Pressable
              key={id}
              style={styles.checkRow}
              onPress={() => toggleGroup(id)}
            >
              <Text>{checked ? "[x]" : "[ ]"}</Text>
              <Text style={{ flex: 1 }}>{m.group.name}</Text>
            </Pressable>
          );
        })
      )}

      <Text style={styles.subtitle}>Share with friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.hint}>No friends yet.</Text>
      ) : (
        friends.map((f) => {
          const checked = value.sharedFriendUsernames.includes(f.username);
          return (
            <Pressable
              key={f.username}
              style={styles.checkRow}
              onPress={() => toggleFriend(f.username)}
            >
              <Text>{checked ? "[x]" : "[ ]"}</Text>
              <Text style={{ flex: 1 }}>@{f.username}</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
