import type { GroupSummary } from "@osolot/shared";
import { Pressable, Text, View } from "react-native";
import { styles } from "../lib/styles";

export function GroupCard({
  group,
  onPress,
}: {
  group: GroupSummary;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.subtitle}>{group.name}</Text>
      <Text style={styles.hint} numberOfLines={2}>
        {group.description || "No description"}
      </Text>
      <View style={styles.row}>
        <Text style={styles.badge}>{group.visibility}</Text>
        <Text style={styles.badge}>{group.admissionType}</Text>
        {group.membershipStatus ? (
          <Text style={styles.badge}>{group.membershipStatus}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
