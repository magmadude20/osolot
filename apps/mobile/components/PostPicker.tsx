import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { listMyPosts } from "../lib/api/posts";
import { styles } from "../lib/styles";

export function PostPicker({
  accessToken,
  selectedIds,
  onChange,
}: {
  accessToken: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyPosts(accessToken);
        setPosts(data.map((p) => ({ id: p.id, title: p.title })));
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) return <ActivityIndicator />;
  if (error) return <Text style={styles.hint}>{error}</Text>;
  if (posts.length === 0) {
    return <Text style={styles.hint}>You have no posts to share yet.</Text>;
  }

  return (
    <View>
      {posts.map((p) => {
        const checked = selectedIds.includes(p.id);
        return (
          <Pressable
            key={p.id}
            style={styles.checkRow}
            onPress={() => toggle(p.id)}
          >
            <Text>{checked ? "[x]" : "[ ]"}</Text>
            <Text style={{ flex: 1 }}>{p.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
