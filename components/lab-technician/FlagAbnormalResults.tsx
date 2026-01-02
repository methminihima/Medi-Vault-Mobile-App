import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

interface AbnormalResult {
  id: string;
  testName: string;
  patientName: string;
  result: string;
  flaggedDate: string;
  priority: 'urgent' | 'high';
}

export default function FlagAbnormalResults() {
  const [abnormalResults] = useState<AbnormalResult[]>([
    {
      id: '1',
      testName: 'Lipid Profile',
      patientName: 'Mike Johnson',
      result: 'Total Cholesterol: 280 mg/dL (Very High)',
      flaggedDate: '2024-12-02',
      priority: 'urgent',
    },
    {
      id: '2',
      testName: 'Blood Sugar',
      patientName: 'Sarah Wilson',
      result: 'Fasting Glucose: 180 mg/dL (High)',
      flaggedDate: '2024-12-03',
      priority: 'high',
    },
    {
      id: '3',
      testName: 'Liver Function',
      patientName: 'Tom Anderson',
      result: 'ALT: 85 U/L (Elevated)',
      flaggedDate: '2024-12-01',
      priority: 'high',
    },
  ]);

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Abnormal Results</RNText>
        <RNText style={styles.headerSubtitle}>{abnormalResults.length} flagged results</RNText>
      </View>

      <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent}>
        {abnormalResults.map(result => (
          <View key={result.id} style={styles.resultCard}>
            <View style={styles.alertIcon}>
              <MaterialCommunityIcons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <View style={styles.resultContent}>
              <RNText style={styles.testName}>{result.testName}</RNText>
              <RNText style={styles.patientName}>{result.patientName}</RNText>
              <RNText style={styles.resultText}>{result.result}</RNText>
              <View style={styles.resultFooter}>
                <View style={[styles.priorityBadge, { backgroundColor: result.priority === 'urgent' ? '#EF4444' : '#F59E0B' }]}>
                  <RNText style={styles.priorityText}>{result.priority.toUpperCase()}</RNText>
                </View>
                <RNText style={styles.dateText}>Flagged: {result.flaggedDate}</RNText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  resultsList: { flex: 1, backgroundColor: 'transparent' },
  resultsContent: { padding: 16 },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  alertIcon: { marginRight: 12 },
  resultContent: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  patientName: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  resultText: { fontSize: 14, color: '#EF4444', fontWeight: '600', marginBottom: 12 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
});

