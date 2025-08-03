// src/screens/onboarding/WelcomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../../components/common/GradientButton';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { spacing } from '../../utils/spacing';
import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { userProfile } = useApp();

  useEffect(() => {
    if (userProfile?.username) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [userProfile]);
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradientDark}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>

              <View style={styles.logoInner}>
                <Image
                  source={require('../../../assets/adaptive-icon-Photoroom.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

            </View>
            <Text style={styles.brandText}>FORTIS</Text>
          </View>

          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Progressive Overload</Text>
            <Text style={styles.subTagline}>Made Simple</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Track your workouts, monitor progress, and achieve your fitness goals
            with intelligent progressive overload tracking.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <GradientButton
              title="Get Started"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.button}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    borderRadius: 40,
    overflow: 'hidden',
  },

  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoInner: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: '100%',
    height: '100%',
  },

  brandText: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  tagline: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subTagline: {
    ...typography.h2,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  description: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xxxxxl,
    paddingHorizontal: spacing.xl,
  },
  buttonsContainer: {
    width: '100%',
    position: 'absolute',
    bottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  button: {
    marginBottom: spacing.xl,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.bodyMedium,
    color: colors.info,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
