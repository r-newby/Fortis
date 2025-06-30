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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }

    // Check if user has completed onboarding (username exists)
    const user = data.user;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      Alert.alert('Profile Error', profileError.message);
      return;
    }

    if (!profile?.username) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Username' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }], // change to your home route
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In to FORTIS</Text>
      <Text style={styles.subtitle}>Welcome back, let's lift.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
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
          (!email || !password || loading) && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={!email || !password || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Continue'}</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Don’t have an account?{' '}
        <Text style={styles.linkText} onPress={() => navigation.navigate('SignUp')}>
          Sign up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 24, justifyContent: 'center' },
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
