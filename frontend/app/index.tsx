import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Strike<Text style={styles.accent}>AI</Text></Text>
        <ActivityIndicator size="large" color="#CCFF00" style={styles.loader} />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 48, fontWeight: '900', color: '#FAFAFA', marginBottom: 24 },
  accent: { color: '#CCFF00' },
  loader: { marginTop: 16 },
});
