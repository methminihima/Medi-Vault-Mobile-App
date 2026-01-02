import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleForgotPassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // TODO: Implement forgot password API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Card */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons name="lock-reset" size={32} color="#fff" />
                  </View>
                </View>

                {/* Header */}
                <View style={styles.header}>
                  <RNText style={styles.title}>Forgot Password?</RNText>
                  <RNText style={styles.subtitle}>
                    Enter your email address and we'll send you instructions to reset your password
                  </RNText>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <View style={styles.inputWrapper}>
                    <RNText style={styles.inputLabel}>Email Address</RNText>
                    <TextInput
                      style={[styles.inputContainer, error && styles.inputError]}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {error && <RNText style={styles.errorText}>{error}</RNText>}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleForgotPassword}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <RNText style={styles.buttonText}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </RNText>
                      {!loading && <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />}
                    </View>
                  </TouchableOpacity>

                  {/* Back to Login */}
                  <View style={styles.loginSection}>
                    <RNText style={styles.loginText}>Remember your password?</RNText>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity>
                        <RNText style={styles.loginLink}> Sign In</RNText>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <Ionicons name="shield-checkmark" size={14} color="#6B7280" />
                <RNText style={styles.footerText}>Secured with end-to-end encryption</RNText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.3)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: isSmallScreen ? 30 : 40,
    paddingHorizontal: isTablet ? 40 : 20,
    justifyContent: 'center',
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },

  // Card
  cardContainer: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: isSmallScreen ? 20 : 24,
    padding: isSmallScreen ? 28 : isTablet ? 40 : 32,
    maxWidth: isTablet ? 500 : isSmallScreen ? '100%' : 400,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:  '#1E4BA3ff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor:  '#1E4BA3ff',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  header: {
    marginBottom: isSmallScreen ? 24 : 28,
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 24 : 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form
  form: {
    gap: isSmallScreen ? 16 : 20,
  },
  inputWrapper: {
    marginBottom: isSmallScreen ? 4 : 8,
  },
  inputLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: isSmallScreen ? 48 : 54,
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Button
  button: {
    backgroundColor: '#1E4BA3ff',
    borderRadius: 12,
    height: isSmallScreen ? 50 : 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3ff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Login Link
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#1E4BA3ff',
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});

