import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../../src/config/constants';

interface AdminAddUserProps {
  onBack?: () => void;
  onUserAdded?: (user: any) => void;
}

export default function AdminAddUser({ onBack, onUserAdded }: AdminAddUserProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'patient' as 'admin' | 'doctor' | 'patient' | 'pharmacist' | 'lab_technician',
    username: '',
    password: '',
    confirmPassword: '',
    // Patient specific fields
    nic: '',
    rfid: '',
    dateOfBirth: '',
    gender: '',
    contactInfo: '',
    address: '',
    bloodType: '',
    allergies: '',
    // Doctor specific fields
    specialization: '',
    licenseNumber: '',
    qualifications: '',
    experience: '',
    consultationFee: '',
    availableDays: '',
    // Pharmacist specific fields
    pharmacistLicenseNumber: '',
    // Lab Technician specific fields
    labLicenseNumber: '',
    labSpecialization: '',
  });

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'idle' | 'info' | 'success' | 'error'; text: string }>({
    type: 'idle',
    text: '',
  });

  const roles = [
    { value: 'patient', label: 'Patient', icon: 'account', color: '#3B82F6' },
    { value: 'doctor', label: 'Doctor', icon: 'doctor', color: '#10B981' },
    { value: 'pharmacist', label: 'Pharmacist', icon: 'pill', color: '#8B5CF6' },
    { value: 'lab_technician', label: 'Lab Technician', icon: 'flask', color: '#F59E0B' },
    { value: 'admin', label: 'Administrator', icon: 'shield-account', color: '#EF4444' },
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if (formData.role === 'patient') {
      if (!formData.nic.trim()) {
        newErrors.nic = 'NIC is required for patients';
      }
      if (!formData.rfid.trim()) {
        newErrors.rfid = 'RFID is required for patients';
      }
    }

    if (formData.role === 'doctor') {
      if (!formData.specialization.trim()) {
        newErrors.specialization = 'Specialization is required for doctors';
      }
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required for doctors';
      }
    }

    if (formData.role === 'pharmacist') {
      if (!formData.pharmacistLicenseNumber.trim()) {
        newErrors.pharmacistLicenseNumber = 'License number is required for pharmacists';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRoleSpecificData = () => {
    switch (formData.role) {
      case 'patient':
        return {
          nic: formData.nic,
          rfid: formData.rfid,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          contactInfo: formData.contactInfo,
          address: formData.address,
          bloodType: formData.bloodType,
          allergies: formData.allergies,
        };
      case 'doctor':
        return {
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          qualifications: formData.qualifications.trim() || null,
          experience: formData.experience && formData.experience.trim() !== '' ? parseInt(formData.experience) : null,
          consultationFee: formData.consultationFee && formData.consultationFee.trim() !== '' ? parseFloat(formData.consultationFee) : null,
          availableDays: formData.availableDays.trim() || null,
        };
      case 'pharmacist':
        return {
          licenseNumber: formData.pharmacistLicenseNumber,
        };
      case 'lab_technician':
        return {
          licenseNumber: formData.labLicenseNumber || null,
          specialization: formData.labSpecialization || null,
        };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      setSubmitMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
      return;
    }

    setLoading(true);
    setSubmitMessage({ type: 'info', text: 'Creating user…' });
    try {
      // Call the backend API to create user
      const url = `${API_BASE_URL}/users/create`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          // Include role-specific data
          roleSpecificData: getRoleSpecificData(),
        }),
      });

      clearTimeout(timeout);

      // Some servers return non-JSON error pages; don't let that break the flow.
      const rawText = await response.text();
      const data = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (response.ok && data?.success) {
        Alert.alert('Success', 'User created successfully!');
        setSubmitMessage({ type: 'success', text: 'User created successfully!' });
        onUserAdded?.(data.data);
        
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          role: 'patient',
          username: '',
          password: '',
          confirmPassword: '',
          nic: '',
          rfid: '',
          dateOfBirth: '',
          gender: '',
          contactInfo: '',
          address: '',
          bloodType: '',
          allergies: '',
          specialization: '',
          licenseNumber: '',
          qualifications: '',
          experience: '',
          consultationFee: '',
          availableDays: '',
          pharmacistLicenseNumber: '',
          labLicenseNumber: '',
          labSpecialization: '',
        });
        setErrors({});
      } else {
        const serverMessage =
          data?.message ||
          (rawText && rawText.length < 500 ? rawText : '') ||
          'Failed to create user';
        const validationDetail = data?.errors?.[0]?.msg ? `\n\n${data.errors[0].msg}` : '';
        const errorDetail = data?.error ? `\n\n${data.error}` : '';
        const msg = `HTTP ${response.status} - ${serverMessage}${validationDetail}${errorDetail}`;
        Alert.alert('Error', msg);
        setSubmitMessage({ type: 'error', text: msg });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const isAbort = String(error).toLowerCase().includes('abort');
      const msg = isAbort
        ? `Request timed out. Is the backend running?\n\nBase URL: ${API_BASE_URL}`
        : `Unable to connect to the server.\n\nBase URL: ${API_BASE_URL}\n\n${String(error)}`;
      Alert.alert('Connection Error', msg);
      setSubmitMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Form',
      'Are you sure you want to clear all fields?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setFormData({
              fullName: '',
              email: '',
              role: 'patient',
              username: '',
              password: '',
              confirmPassword: '',
              nic: '',
              rfid: '',
              dateOfBirth: '',
              gender: '',
              contactInfo: '',
              address: '',
              bloodType: '',
              allergies: '',
              specialization: '',
              licenseNumber: '',
              qualifications: '',
              experience: '',
              consultationFee: '',
              availableDays: '',
              pharmacistLicenseNumber: '',
              labLicenseNumber: '',
              labSpecialization: '',
            });
            setErrors({});
          },
        },
      ]
    );
  };

  const selectedRole = roles.find(r => r.value === formData.role);

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      <View style={styles.gradientOverlay} />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#3B82F6" />
            <RNText style={styles.cardTitle}>Personal Information</RNText>
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Full Name *</RNText>
            <TextInput
              style={[styles.inputContainer, errors.fullName && styles.inputError]}
              placeholder="Enter full name"
              placeholderTextColor="#9CA3AF"
              value={formData.fullName}
              onChangeText={(text) => {
                setFormData({ ...formData, fullName: text });
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
            />
            {errors.fullName && <RNText style={styles.errorText}>{errors.fullName}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Email Address *</RNText>
            <TextInput
              style={[styles.inputContainer, errors.email && styles.inputError]}
              placeholder="Enter email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <RNText style={styles.errorText}>{errors.email}</RNText>}
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#8B5CF6" />
            <RNText style={styles.cardTitle}>Account Security</RNText>
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Username *</RNText>
            <TextInput
              style={[styles.inputContainer, errors.username && styles.inputError]}
              placeholder="Enter username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              value={formData.username}
              onChangeText={(text) => {
                setFormData({ ...formData, username: text });
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
            />
            {errors.username && <RNText style={styles.errorText}>{errors.username}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Password *</RNText>
              <TextInput
              style={[styles.inputContainer, errors.password && styles.inputError]}
              placeholder="Enter password (min. 6 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
            />
            {errors.password && <RNText style={styles.errorText}>{errors.password}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Confirm Password *</RNText>
            <TextInput
              style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}
              placeholder="Re-enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData({ ...formData, confirmPassword: text });
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
            />
            {errors.confirmPassword && <RNText style={styles.errorText}>{errors.confirmPassword}</RNText>}
          </View>

          <View style={styles.passwordHint}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <RNText style={styles.passwordHintText}>
              Password must be at least 6 characters long
            </RNText>
          </View>
        </View>

        {/* Role Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-account" size={24} color="#8B5CF6" />
            <RNText style={styles.cardTitle}>User Role</RNText>
          </View>
          
          <TouchableOpacity 
            style={styles.roleSelector}
            onPress={() => setShowRoleMenu(!showRoleMenu)}
          >
            <View style={styles.roleDisplay}>
              <MaterialCommunityIcons 
                name={selectedRole?.icon as any} 
                size={24} 
                color={selectedRole?.color} 
              />
              <RNText style={styles.roleText}>{selectedRole?.label}</RNText>
            </View>
            <Ionicons 
              name={showRoleMenu ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {showRoleMenu && (
            <View style={styles.roleMenu}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    formData.role === role.value && styles.roleOptionActive
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, role: role.value as any });
                    setShowRoleMenu(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={role.icon as any} 
                    size={24} 
                    color={role.color} 
                  />
                  <RNText style={styles.roleOptionText}>{role.label}</RNText>
                  {formData.role === role.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Role-Specific Information */}
        {formData.role === 'patient' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#3B82F6" />
              <RNText style={styles.cardTitle}>Patient Information</RNText>
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>NIC *</RNText>
              <TextInput
                style={[styles.inputContainer, errors.nic && styles.inputError]}
                placeholder="e.g., 123456789V"
                placeholderTextColor="#9CA3AF"
                value={formData.nic}
                onChangeText={(text) => {
                  setFormData({ ...formData, nic: text });
                  if (errors.nic) setErrors({ ...errors, nic: '' });
                }}
              />
              {errors.nic && <RNText style={styles.errorText}>{errors.nic}</RNText>}
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>RFID *</RNText>
              <TextInput
                style={[styles.inputContainer, errors.rfid && styles.inputError]}
                placeholder="e.g., RF123456"
                placeholderTextColor="#9CA3AF"
                value={formData.rfid}
                onChangeText={(text) => {
                  setFormData({ ...formData, rfid: text });
                  if (errors.rfid) setErrors({ ...errors, rfid: '' });
                }}
              />
              {errors.rfid && <RNText style={styles.errorText}>{errors.rfid}</RNText>}
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Date of Birth</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Gender</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="Male, Female, Other"
                placeholderTextColor="#9CA3AF"
                value={formData.gender}
                onChangeText={(text) => setFormData({ ...formData, gender: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Contact Info (Phone)</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formData.contactInfo}
                onChangeText={(text) => setFormData({ ...formData, contactInfo: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Address</RNText>
              <TextInput
                style={[styles.inputContainer, { height: 80 }]}
                placeholder="Enter address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Blood Type</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="e.g., A+, B-, O+, AB+"
                placeholderTextColor="#9CA3AF"
                value={formData.bloodType}
                onChangeText={(text) => setFormData({ ...formData, bloodType: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Allergies</RNText>
              <TextInput
                style={[styles.inputContainer, { height: 80 }]}
                placeholder="None, Penicillin, etc."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={formData.allergies}
                onChangeText={(text) => setFormData({ ...formData, allergies: text })}
              />
            </View>
          </View>
        )}

        {formData.role === 'doctor' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="stethoscope" size={24} color="#10B981" />
              <RNText style={styles.cardTitle}>Doctor Information</RNText>
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Specialization *</RNText>
              <TextInput
                style={[styles.inputContainer, errors.specialization && styles.inputError]}
                placeholder="e.g., Cardiology, Neurology"
                placeholderTextColor="#9CA3AF"
                value={formData.specialization}
                onChangeText={(text) => {
                  setFormData({ ...formData, specialization: text });
                  if (errors.specialization) setErrors({ ...errors, specialization: '' });
                }}
              />
              {errors.specialization && <RNText style={styles.errorText}>{errors.specialization}</RNText>}
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Medical License Number *</RNText>
              <TextInput
                style={[styles.inputContainer, errors.licenseNumber && styles.inputError]}
                placeholder="e.g., MD12345"
                placeholderTextColor="#9CA3AF"
                value={formData.licenseNumber}
                onChangeText={(text) => {
                  setFormData({ ...formData, licenseNumber: text });
                  if (errors.licenseNumber) setErrors({ ...errors, licenseNumber: '' });
                }}
              />
              {errors.licenseNumber && <RNText style={styles.errorText}>{errors.licenseNumber}</RNText>}
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Qualifications</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="e.g., MBBS, MD"
                placeholderTextColor="#9CA3AF"
                value={formData.qualifications}
                onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Years of Experience</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="Enter years of experience"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.experience}
                onChangeText={(text) => setFormData({ ...formData, experience: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Consultation Fee</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="e.g., 5000.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={formData.consultationFee}
                onChangeText={(text) => setFormData({ ...formData, consultationFee: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Available Days</RNText>
              <TextInput
                style={[styles.inputContainer, { height: 80 }]}
                placeholder='e.g., ["Monday","Wednesday","Friday"]'
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={formData.availableDays}
                onChangeText={(text) => setFormData({ ...formData, availableDays: text })}
              />
            </View>
          </View>
        )}

        {formData.role === 'pharmacist' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="pill" size={24} color="#8B5CF6" />
              <RNText style={styles.cardTitle}>Pharmacist Information</RNText>
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Pharmacy License Number *</RNText>
              <TextInput
                style={[styles.inputContainer, errors.pharmacistLicenseNumber && styles.inputError]}
                placeholder="Enter pharmacy license number"
                placeholderTextColor="#9CA3AF"
                value={formData.pharmacistLicenseNumber}
                onChangeText={(text) => {
                  setFormData({ ...formData, pharmacistLicenseNumber: text });
                  if (errors.pharmacistLicenseNumber) setErrors({ ...errors, pharmacistLicenseNumber: '' });
                }}
              />
              {errors.pharmacistLicenseNumber && <RNText style={styles.errorText}>{errors.pharmacistLicenseNumber}</RNText>}
            </View>
          </View>
        )}

        {formData.role === 'lab_technician' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="flask" size={24} color="#F59E0B" />
              <RNText style={styles.cardTitle}>Lab Technician Information</RNText>
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Specialization</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="e.g., Microbiology, Hematology"
                placeholderTextColor="#9CA3AF"
                value={formData.labSpecialization}
                onChangeText={(text) => setFormData({ ...formData, labSpecialization: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Lab License Number</RNText>
              <TextInput
                style={styles.inputContainer}
                placeholder="Enter lab license number"
                placeholderTextColor="#9CA3AF"
                value={formData.labLicenseNumber}
                onChangeText={(text) => setFormData({ ...formData, labLicenseNumber: text })}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color="#EF4444" />
            <RNText style={styles.resetButtonText}>Reset</RNText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <RNText style={styles.submitButtonText}>Create User</RNText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {submitMessage.type !== 'idle' && !!submitMessage.text && (
          <View style={styles.submitMessageWrap}>
            <RNText
              style={[
                styles.submitMessageText,
                submitMessage.type === 'success' && styles.submitMessageSuccess,
                submitMessage.type === 'error' && styles.submitMessageError,
              ]}
            >
              {submitMessage.text}
            </RNText>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    backgroundColor: '#1E4BA3',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleMenu: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roleOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '400',
    height: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  passwordHintText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  touchableInput: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 48,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 15,
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpacer: {
    height: 20,
  },
  submitMessageWrap: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  submitMessageText: {
    fontSize: 12,
    color: '#374151',
  },
  submitMessageSuccess: {
    color: '#059669',
  },
  submitMessageError: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  datePickerContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

