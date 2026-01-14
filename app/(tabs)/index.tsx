import { storageService } from '@/services/storageService';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await storageService.getUser();
    setUser(userData);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1E4BA3ff" />
      </View>
    );
  }

  // Redirect to appropriate dashboard based on role
  if (user?.role === 'admin') {
    return <Redirect href="/(tabs)/admin-dashboard" />;
  }
  
  if (user?.role === 'doctor') {
    return <Redirect href="/(tabs)/doctor-dashboard" />;
  }

  if (user?.role === 'pharmacist') {
    return <Redirect href={"/(tabs)/pharmacist-dashboard" as any}  />;
  }

  if (user?.role === 'patient') {
    return <Redirect href="/(tabs)/patient-dashboard" />;
  }

  // Default fallback
  return <Redirect href="/(tabs)/explore" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

