import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface LabTestItem {
  testName: string;
  testType: string;
  category: string;
  instructions: string;
}

interface PatientInfo {
  name: string;
  nic: string;
  age: string;
  phone: string;
  clinicalInfo: string;
}

const TEST_CATEGORIES = [
  'Hematology',
  'Biochemistry',
  'Microbiology',
  'Immunology',
  'Pathology',
  'Radiology',
  'Other',
];

const TEST_PRIORITIES = [
  { value: 'routine', label: 'Routine', color: '#10B981' },
  { value: 'urgent', label: 'Urgent', color: '#F59E0B' },
  { value: 'stat', label: 'STAT', color: '#EF4444' },
];

const COMMON_TESTS = [
  { name: 'Complete Blood Count (CBC)', type: 'Blood Test', category: 'Hematology' },
  { name: 'Lipid Profile', type: 'Blood Test', category: 'Biochemistry' },
  { name: 'Blood Glucose (Fasting)', type: 'Blood Test', category: 'Biochemistry' },
  { name: 'Liver Function Test (LFT)', type: 'Blood Test', category: 'Biochemistry' },
  { name: 'Kidney Function Test (KFT)', type: 'Blood Test', category: 'Biochemistry' },
  { name: 'Thyroid Profile', type: 'Blood Test', category: 'Biochemistry' },
  { name: 'Urinalysis', type: 'Urine Test', category: 'Pathology' },
  { name: 'Chest X-Ray', type: 'Imaging', category: 'Radiology' },
  { name: 'ECG', type: 'Diagnostic', category: 'Other' },
];

export default function OrderLabTest() {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    nic: '',
    age: '',
    phone: '',
    clinicalInfo: '',
  });

  const [labTests, setLabTests] = useState<LabTestItem[]>([
    { testName: '', testType: '', category: '', instructions: '' },
  ]);

  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showCommonTests, setShowCommonTests] = useState(false);

  const addLabTest = () => {
    setLabTests([
      ...labTests,
      { testName: '', testType: '', category: '', instructions: '' },
    ]);
  };

  const removeLabTest = (index: number) => {
    if (labTests.length > 1) {
      setLabTests(labTests.filter((_, i) => i !== index));
    }
  };

  const updateLabTest = (index: number, field: keyof LabTestItem, value: string) => {
    const updatedTests = [...labTests];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setLabTests(updatedTests);
  };

  const addCommonTest = (test: typeof COMMON_TESTS[0]) => {
    const newTest: LabTestItem = {
      testName: test.name,
      testType: test.type,
      category: test.category,
      instructions: '',
    };

    // Check if test already exists
    const exists = labTests.some(t => t.testName === test.name);
    if (exists) {
      Alert.alert('Info', `${test.name} is already added`);
      return;
    }

    // If last test is empty, replace it
    if (labTests.length === 1 && !labTests[0].testName) {
      setLabTests([newTest]);
    } else {
      setLabTests([...labTests, newTest]);
    }
  };

  const validateForm = () => {
    if (!patientInfo.name.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name');
      return false;
    }

    if (!patientInfo.nic.trim()) {
      Alert.alert('Validation Error', 'Please enter patient NIC');
      return false;
    }

    const hasValidTest = labTests.some(
      test => test.testName.trim() && test.testType.trim()
    );

    if (!hasValidTest) {
      Alert.alert('Validation Error', 'Please add at least one complete lab test');
      return false;
    }

    return true;
  };

  const handleGenerateLabOrder = () => {
    if (!validateForm()) return;

    const orderCode = `LAB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    Alert.alert(
      'Lab Order Generated',
      `Lab Order Code: ${orderCode}\n\nThe lab order has been created and sent to the lab technician.`,
      [{ text: 'OK' }]
    );
  };

  const handleSaveLabOrder = () => {
    if (!validateForm()) return;

    Alert.alert(
      'Success',
      'Lab order saved successfully! The patient will receive a notification.',
      [
        {
          text: 'Create New Order',
          onPress: () => {
            setPatientInfo({
              name: '',
              nic: '',
              age: '',
              phone: '',
              clinicalInfo: '',
            });
            setLabTests([{ testName: '', testType: '', category: '', instructions: '' }]);
            setPriority('routine');
            setAdditionalNotes('');
          },
        },
        { text: 'Done' },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="test-tube" size={32} color="#1E4BA3" />
          <Text style={styles.headerTitle}>Order Lab Tests</Text>
          <Text style={styles.headerSubtitle}>Complete patient and test information</Text>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Patient Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter patient name"
              value={patientInfo.name}
              onChangeText={text => setPatientInfo({ ...patientInfo, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIC Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter NIC number"
              value={patientInfo.nic}
              onChangeText={text => setPatientInfo({ ...patientInfo, nic: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                value={patientInfo.age}
                onChangeText={text => setPatientInfo({ ...patientInfo, age: text })}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={patientInfo.phone}
                onChangeText={text => setPatientInfo({ ...patientInfo, phone: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinical Information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Patient symptoms, diagnosis, or reason for test"
              multiline
              numberOfLines={3}
              value={patientInfo.clinicalInfo}
              onChangeText={text => setPatientInfo({ ...patientInfo, clinicalInfo: text })}
            />
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Priority</Text>
          <View style={styles.priorityContainer}>
            {TEST_PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityButton,
                  priority === p.value && {
                    backgroundColor: p.color,
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.value as any)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p.value && styles.priorityTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Common Tests Quick Add */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.commonTestsToggle}
            onPress={() => setShowCommonTests(!showCommonTests)}
          >
            <Text style={styles.sectionTitle}>Quick Add Common Tests</Text>
            <Ionicons
              name={showCommonTests ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#1E4BA3"
            />
          </TouchableOpacity>

          {showCommonTests && (
            <View style={styles.commonTestsGrid}>
              {COMMON_TESTS.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.commonTestCard}
                  onPress={() => addCommonTest(test)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#1E4BA3" />
                  <Text style={styles.commonTestName}>{test.name}</Text>
                  <Text style={styles.commonTestType}>{test.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Lab Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lab Tests</Text>
            <TouchableOpacity style={styles.addButton} onPress={addLabTest}>
              <Ionicons name="add-circle" size={24} color="#1E4BA3" />
              <Text style={styles.addButtonText}>Add Test</Text>
            </TouchableOpacity>
          </View>

          {labTests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <View style={styles.testNumberBadge}>
                  <Text style={styles.testNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.testCardTitle}>Test {index + 1}</Text>
                {labTests.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeLabTest(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Complete Blood Count"
                  value={test.testName}
                  onChangeText={text => updateLabTest(index, 'testName', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Type *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Blood Test, Urine Test, Imaging"
                  value={test.testType}
                  onChangeText={text => updateLabTest(index, 'testType', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {TEST_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        test.category === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => updateLabTest(index, 'category', cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          test.category === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Instructions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Fasting required, sample collection notes, etc."
                  multiline
                  numberOfLines={2}
                  value={test.instructions}
                  onChangeText={text => updateLabTest(index, 'instructions', text)}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional information or special requirements"
            multiline
            numberOfLines={3}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateLabOrder}
          >
            <MaterialCommunityIcons name="barcode-scan" size={22} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Lab Order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveLabOrder}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Save Lab Order</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#1E4BA3" />
          <Text style={styles.infoText}>
            Lab orders will be sent to the lab technician for processing. Patients will
            receive notifications when results are ready.
          </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(98, 216, 245, 0.1)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  priorityTextActive: {
    color: '#fff',
  },
  commonTestsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  commonTestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  commonTestCard: {
    width: (width - 80) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  commonTestName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  commonTestType: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  testCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  testNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1E4BA3',
    borderColor: '#1E4BA3',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 75, 163, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 75, 163, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

