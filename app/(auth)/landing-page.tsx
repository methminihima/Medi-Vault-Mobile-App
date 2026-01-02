import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    useFadeIn,
    usePressAnimation
} from '../../utils/animations';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

// -----------------------------------------
// HEADER COMPONENT
// -----------------------------------------
interface HeaderProps {
  router: ReturnType<typeof useRouter>;
}

const Header: React.FC<HeaderProps> = ({ router }) => {
  // Simplified header animations - removed excessive slide animations
  const headerAnimation = useFadeIn(0, 300);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={[styles.headerContainer, headerAnimation]}>
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="hospital-building" size={28} color="#007bff" />
        <Text style={styles.logoText}>MediVault</Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.themToggle}>
          <Feather name="moon" size={20} color="#374151" />
        </TouchableOpacity>

        <Animated.View style={pressStyle}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.headerButton}
            onPress={() => {
              console.log('Sign In button pressed');
              router.push('/(auth)/login' as any);
            }}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Text style={styles.headerButtonText}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// -----------------------------------------
// LANDING PAGE COMPONENT
// -----------------------------------------
export default function LandingPage(): React.ReactElement {
  const router = useRouter();
  // Simplified hero animations - only essential fade-in
  const heroAnimation = useFadeIn(0, 400);
  const { animatedStyle: primaryButtonPress, onPressIn: onPrimaryPress, onPressOut: onPrimaryRelease } = usePressAnimation();
  const { animatedStyle: secondaryButtonPress, onPressIn: onSecondaryPress, onPressOut: onSecondaryRelease } = usePressAnimation();

  const statsData = [
    { icon: 'account-group', count: '10,000+', label: 'Patients', color: '#3B82F6' },
    { icon: 'doctor', count: '500+', label: 'Doctors', color: '#10B981' },
    { icon: 'flask', count: '50+', label: 'Pharmacies', color: '#8B5CF6' },
    { icon: 'test-tube', count: '30+', label: 'Lab Centers', color: '#F59E0B' },
  ];

  const featuresData = [
    {
      icon: 'calendar-check',
      title: 'Smart Appointments',
      description: 'Book and manage appointments with doctors across specialties',
      color: '#3B82F6',
    },
    {
      icon: 'shield-lock',
      title: 'Secure Records',
      description: 'Encrypted medical records accessible only to authorized personnel',
      color: '#10B981',
    },
    {
      icon: 'pill',
      title: 'Digital Prescriptions',
      description: 'QR-coded prescriptions for secure pharmacy verification',
      color: '#8B5CF6',
    },
    {
      icon: 'test-tube',
      title: 'Lab Integration',
      description: 'Seamless lab test ordering and instant result notifications',
      color: '#F59E0B',
    },
    {
      icon: 'chat',
      title: 'Real-time Chat',
      description: 'Direct communication between patients and healthcare providers',
      color: '#06B6D4',
    },
    {
      icon: 'credit-card',
      title: 'Billing Management',
      description: 'Transparent billing with multiple payment options',
      color: '#EC4899',
    },
  ];

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.safeAreaWrapper}>
        <Header router={router} />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Card */}
          <Animated.View style={[styles.contentCard, heroAnimation]}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Your Health,</Text>
              <Text style={styles.titleHighlight}>Digitally</Text>
              <Text style={styles.titleHighlight}>Connected</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              MediVault brings together patients, doctors, pharmacists, and lab technicians in one 
              secure, comprehensive, and patient-centered healthcare management platform. Secure, efficient, and patient-centered.
            </Text>

            {/* Hero Image */}
            <View>
              <TouchableOpacity 
                style={styles.heroImageContainer}
                activeOpacity={0.9}
                onPress={() => {}}
              >
                <View style={styles.heroImageBorder}>
                  <ImageBackground
                    source={require('../../assets/images/medical-team.jpg')}
                    style={styles.heroImage}
                    imageStyle={styles.heroImageStyle}
                    blurRadius={0}
                  >
                    <View style={styles.heroImageOverlay} />
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <Animated.View style={[{ flex: 1 }, primaryButtonPress]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.buttonPrimary}
                  onPress={() => {
                    console.log('Get Started button pressed');
                    router.push('/(auth)/register' as any);
                  }}
                  onPressIn={onPrimaryPress}
                  onPressOut={onPrimaryRelease}
                >
                  <Text style={styles.buttonPrimaryText}>Get Started</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[{ flex: 1 }, secondaryButtonPress]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.buttonSecondary}
                  onPress={() => {
                    console.log('Sign In (secondary) button pressed');
                    router.push('/(auth)/login' as any);
                  }}
                  onPressIn={onSecondaryPress}
                  onPressOut={onSecondaryRelease}
                >
                  <Text style={styles.buttonSecondaryText}>Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Stats Grid - Removed stagger animation for better performance */}
            <View style={styles.statsContainer}>
              {statsData.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                    <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statCount}>{stat.count}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Features Section - Simplified animations */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>
              Everything You Need for Modern Healthcare
            </Text>
            <Text style={styles.featuresSubtitle}>
              A complete platform designed to streamline healthcare workflows and improve patient outcomes
            </Text>

            <View style={styles.featuresGrid}>
              {featuresData.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                    <MaterialCommunityIcons name={feature.icon as any} size={28} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Call to Action Banner - Removed scale animation */}
          <View style={styles.ctaBanner}>
            <Text style={styles.ctaTitle}>Ready to Transform Healthcare Management?</Text>
            <Text style={styles.ctaSubtitle}>
              Join thousands of healthcare professionals and patients using MediVault
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.ctaButton}
              onPress={() => {
                console.log('Start Now button pressed');
                router.push('/(auth)/register' as any);
              }}
            >
              <Text style={styles.ctaButtonText}>Start Now</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerBadge}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#007bff" />
              <Text style={styles.footerBadgeText}>MediVault</Text>
            </View>
            <Text style={styles.footerText}>
              © 2025 MediVault. Comprehensive Healthcare Management System.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// -----------------------------------------
// STYLES
// -----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  safeAreaWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : Platform.OS === 'ios' ? 50 : 0,
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E4BA3ff',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Content Card
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 24,
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

  // Title Section
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: isSmallScreen ? 34 : 38,
  },
  titleHighlight: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '800',
    color: '#1E4BA3ff',
    lineHeight: isSmallScreen ? 34 : 38,
  },
  description: {
    fontSize: isSmallScreen ? 14 : 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 24,
  },

  // Hero Image
  heroImageContainer: {
    width: '100%',
    height: isSmallScreen ? 180 : 220,
    marginBottom: 24,
    borderRadius: 18,
    padding: 3,
    backgroundColor: 'rgba(30, 75, 163, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 10 },
    }),
  },
  heroImageBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageStyle: {
    borderRadius: 14,
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53, 198, 235, 0.08)',
    borderRadius: 14,
  },

  // Button Group
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#1E4BA3ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007bff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E4BA3ff',
  },
  buttonSecondaryText: {
    color: '#1E4BA3ff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Features Section
  featuresSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 24,
    marginTop: 20,
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
  featuresTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Call to Action Banner
  ctaBanner: {
    backgroundColor: '#1E4BA3ff',
    borderRadius: 24,
    padding: isSmallScreen ? 28 : 32,
    marginTop: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor:'#1E4BA3ff',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  ctaTitle: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  ctaButtonText: {
    color: '#1E4BA3ff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  footerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});



