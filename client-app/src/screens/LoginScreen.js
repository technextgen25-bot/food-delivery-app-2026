import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOtp } = useAuth();

  async function handleSendCode() {
    if (phone.length < 8) {
      Alert.alert('Numéro invalide', 'Merci de saisir un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(phone);
      navigation.navigate('OtpVerification', { phone });
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'envoyer le code. Réessaie plus tard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue 👋</Text>
      <Text style={styles.subtitle}>Connecte-toi avec ton numéro de téléphone</Text>

      <TextInput
        style={styles.input}
        placeholder="+213 6 00 00 00 00"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Recevoir le code'}</Text>
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
