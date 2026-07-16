import { View, Text, StyleSheet } from 'react-native';
export default function wingetScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>winget</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#55557a', fontSize: 16 },
});