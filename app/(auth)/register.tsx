import { authApi } from '@/api/auth';
import { storageService } from '@/services/storageService';
import { RegisterData } from '@/types/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn, useScaleIn, useSlideInBottom } from '../../utils/animations';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

type RoleType = 'patient' | 'doctor' | 'pharmacist' | 'lab_technician' | 'admin';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'patient' as RoleType,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Slow animations (600-800ms)
  const backButtonAnim = useFadeIn(0, 400);
  const iconAnim = useScaleIn(200);
  const titleAnim = useSlideInBottom(300, 30);
  const subtitleAnim = useFadeIn(400, 600);
  const cardAnim = useSlideInBottom(500, 40);

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e: Record<string, string | undefined> = {};
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    
    if (!formData.fullName) e.fullName = 'Full name is required';
    if (!formData.email) e.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.phone) e.phone = 'Phone is required';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authApi.register(formData as RegisterData);
      const { token, user } = response.data;

      await storageService.setToken(token);
      await storageService.setUser(user);

      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {/* Back Button */}
        <Animated.View style={backButtonAnim}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.content}>
              {/* Welcome Badge */}
              <Animated.View style={[styles.iconBadge, iconAnim]}>
                <MaterialCommunityIcons name="account-plus" size={32} color="#fff" />
              </Animated.View>

              <Animated.Text style={[styles.welcomeTitle, titleAnim]}>Create Account</Animated.Text>
              <Animated.Text style={[styles.welcomeSubtitle, subtitleAnim]}>Join MediVault and manage your health</Animated.Text>

              {/* Register Card */}
              <Animated.View style={[styles.card, cardAnim]}>
                {/* Role Selection */}
                <View style={styles.roleSection}>
                  <RNText style={styles.roleLabel}>Select Your Role</RNText>
                  <View style={styles.roleGrid}>
                    {[
                      { key: 'patient', label: 'Patient', iconName: 'person-outline', iconLib: 'Ionicons', color: '#10B981' },
                      { key: 'doctor', label: 'Doctor', iconName: 'medical-outline', iconLib: 'Ionicons', color: '#3B82F6' },
                      { key: 'pharmacist', label: 'Pharmacist', iconName: 'flask-outline', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6' },
                      { key: 'lab_technician', label: 'Lab Tech', iconName: 'test-tube', iconLib: 'MaterialCommunityIcons', color: '#F59E0B' },
                      { key: 'admin', label: 'Admin', iconName: 'settings-outline', iconLib: 'Ionicons', color: '#EF4444' },
                    ].map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.roleCard,
                          formData.role === r.key && { 
                            borderColor: r.color,
                            backgroundColor: `${r.color}10`,
                          }
                        ]}
                        onPress={() => updateForm('role', r.key)}
                        activeOpacity={0.7}
                      >
                        {r.iconLib === 'Ionicons' ? (
                          <Ionicons name={r.iconName as any} size={24} color={formData.role === r.key ? r.color : '#6B7280'} />
                        ) : (
                          <MaterialCommunityIcons name={r.iconName as any} size={24} color={formData.role === r.key ? r.color : '#6B7280'} />
                        )}
                        <RNText style={[
                          styles.roleCardText,
                          formData.role === r.key && { color: r.color, fontWeight: '600' }
                        ]}>
                          {r.label}
                        </RNText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                  {/* Full Name */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputContainer, errors.fullName && styles.inputError]}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={formData.fullName}
                      onChangeText={(val) => updateForm('fullName', val)}
                      autoCapitalize="words"
                    />
                    {errors.fullName && <RNText style={styles.errorText}>{errors.fullName}</RNText>}
                  </View>

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputContainer, errors.email && styles.inputError]}
                      placeholder="Email Address"
                      placeholderTextColor="#9CA3AF"
                      value={formData.email}
                      onChangeText={(val) => updateForm('email', val)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {errors.email && <RNText style={styles.errorText}>{errors.email}</RNText>}
                  </View>

                  {/* Phone */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputContainer, errors.phone && styles.inputError]}
                      placeholder="Phone Number"
                      placeholderTextColor="#9CA3AF"
                      value={formData.phone}
                      onChangeText={(val) => updateForm('phone', val)}
                      keyboardType="phone-pad"
                    />
                    {errors.phone && <RNText style={styles.errorText}>{errors.phone}</RNText>}
                  </View>

                  {/* Password */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputContainer, errors.password && styles.inputError]}
                      placeholder="Password (min 8 characters)"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      autoCapitalize="none"
                      value={formData.password}
                      onChangeText={(val) => updateForm('password', val)}
                    />
                    {errors.password && <RNText style={styles.errorText}>{errors.password}</RNText>}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirm Password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      autoCapitalize="none"
                      value={formData.confirmPassword}
                      onChangeText={(val) => updateForm('confirmPassword', val)}
                    />
                    {errors.confirmPassword && <RNText style={styles.errorText}>{errors.confirmPassword}</RNText>}
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    disabled={loading}
                    onPress={handleRegister}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <View style={styles.buttonContent}>
                        <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                        <RNText style={[styles.registerButtonText, { marginLeft: 8 }]}>Creating...</RNText>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <RNText style={styles.registerButtonText}>Create Account</RNText>
                        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.loginSection}>
                    <RNText style={styles.loginText}>Already have an account? </RNText>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
                      <RNText style={styles.loginLink}>Sign In</RNText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.3)',
  },
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
    elevation: 4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 30,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: isTablet ? 40 : 20,
  },
  iconBadge: {
    width: isSmallScreen ? 70 : 80,
    height: isSmallScreen ? 70 : 80,
    borderRadius: isSmallScreen ? 35 : 40,
    backgroundColor: '#1E4BA3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: isSmallScreen ? 26 : 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#4B5563',
    marginBottom: isSmallScreen ? 24 : 32,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: isTablet ? 500 : 400,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: isSmallScreen ? 20 : 24,
    padding: isSmallScreen ? 20 : isTablet ? 32 : 24,
    elevation: 8,
  },
  roleSection: {
    marginBottom: isSmallScreen ? 20 : 24,
  },
  roleLabel: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 8 : 10,
  },
  roleCard: {
    flex: 1,
    minWidth: isSmallScreen ? '18%' : '18%',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: 12,
    padding: isSmallScreen ? 10 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  roleCardText: {
    fontSize: isSmallScreen ? 9 : 10,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  formSection: {
    gap: isSmallScreen ? 14 : 16,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: isSmallScreen ? 48 : 52,
    fontSize: isSmallScreen ? 14 : 15,
    color: '#1F2937',
    fontWeight: '400',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#1E4BA3ff',
    borderRadius: 12,
    height: isSmallScreen ? 50 : 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallScreen ? 8 : 12,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallScreen ? 16 : 20,
  },
  loginText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: isSmallScreen ? 13 : 14,
    color:  '#1E4BA3ff',
    fontWeight: '600',
  },
});

