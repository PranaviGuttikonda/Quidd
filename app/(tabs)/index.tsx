import { View, Text, StyleSheet } from 'react-native';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Quidd</Text>
      <Text style={styles.sub}>Dashboard coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#ff6ec7', fontSize: 32, fontWeight: '600' },
  sub: { color: '#55557a', fontSize: 14, marginTop: 8 },
});