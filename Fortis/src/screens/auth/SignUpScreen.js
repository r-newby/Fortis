import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../../supabase';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Missing fields', 'Please fill out all fields.');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert('Invalid username', 'Username must be 3–20 characters.');
      return;
    }

    setLoading(true);

    // Check if username is already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      setLoading(false);
      Alert.alert('Username taken', 'Please choose a different username.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // Go to onboarding flow and pass the username
    navigation.reset({
      index: 0,
      routes: [{ name: 'FitnessLevel', params: { username } }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>1 of 3</Text>
      <Text style={styles.title}>Welcome to FORTIS</Text>
      <Text style={styles.subtitle}>Let’s set up your account</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.hint}>3–20 characters, unique</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!email || !password || !username || loading) && styles.buttonDisabled,
        ]}
        onPress={handleSignUp}
        disabled={!email || !password || !username || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>
          Log in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 24, justifyContent: 'center' },
  step: { color: '#FF4C5E', marginBottom: 12, fontSize: 14 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#AAAAAA', marginBottom: 32 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, color: '#FFFFFF', marginBottom: 8 },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  hint: { color: '#888888', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#FF4C5E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  footerText: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 24,
  },
  linkText: { color: '#FF4C5E' },
});
