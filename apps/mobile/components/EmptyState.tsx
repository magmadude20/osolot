import { Text, View } from "react-native";
import { styles } from "../lib/styles";

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.hint}>{message}</Text>
    </View>
  );
}
