import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function OtpVerificationScreen({ route }) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp } = useAuth();

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('Code invalide', 'Le code doit contenir 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, code, fullName);
      // La navigation se met à jour automatiquement via AuthContext (user devient non-null)
    } catch (error) {
      Alert.alert('Erreur', 'Code incorrect ou expiré.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>Code envoyé au {phone}</Text>

      <TextInput
        style={styles.input}
        placeholder="Code à 6 chiffres"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <TextInput
        style={styles.input}
        placeholder="Ton nom complet (optionnel)"
        value={fullName}
        onChangeText={setFullName}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Vérification...' : 'Confirmer'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF5A1F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
