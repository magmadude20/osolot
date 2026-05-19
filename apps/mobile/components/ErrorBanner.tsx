import { Text, View } from "react-native";
import { styles } from "../lib/styles";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={[styles.card, { borderColor: "#c00", borderWidth: 1 }]}>
      <Text style={{ color: "#c00", fontSize: 14 }}>{message}</Text>
    </View>
  );
}
