import { Redirect } from 'expo-router';
import React from 'react';

export default function AuthIndex() {
  // Use the Redirect component so navigation occurs after layout mounts
  return <Redirect href="/(auth)/landing-page" />;
}

