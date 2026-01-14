import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
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
import { storageService } from '../../src/services/storageService';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  medications: Medication[];
  diagnosis: string;
  notes: string;
}

type CreatePrescriptionProps = {
  patientId?: string | number;
  appointmentId?: string | number;
  onSaved?: (result: { id: string }) => void;
};

export default function CreatePrescription({ patientId, appointmentId, onSaved }: CreatePrescriptionProps) {
  const [prescriptionData, setPrescriptionData] = React.useState<PrescriptionData>({
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    diagnosis: '',
    notes: ''
  });

  const [prescriptionCode, setPrescriptionCode] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = React.useState<number | null>(null);
  const [currentDoctor, setCurrentDoctor] = React.useState<any>(null);

  // Load current doctor info
  React.useEffect(() => {
    const loadDoctor = async () => {
      const user = await storageService.getUser();
      setCurrentDoctor(user);
    };
    loadDoctor();
  }, []);

  // Patient personal info is not entered here anymore.

  const addMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [...prescriptionData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMeds = [...prescriptionData.medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setPrescriptionData({ ...prescriptionData, medications: updatedMeds });
  };

  const removeMedication = (index: number) => {
    if (prescriptionData.medications.length > 1) {
      setPrescriptionData({
        ...prescriptionData,
        medications: prescriptionData.medications.filter((_, i) => i !== index)
      });
    }
  };

  const validatePrescription = () => {
    if (patientId == null || !String(patientId).trim()) {
      Alert.alert('Validation Error', 'Patient is missing. Please open Create Prescription from an appointment.');
      return false;
    }

    const hasValidMedication = prescriptionData.medications.some(med => 
      med.name && med.dosage && med.frequency && med.duration
    );

    if (!hasValidMedication) {
      Alert.alert('Validation Error', 'Please add at least one complete medication');
      return false;
    }

    return true;
  };

  const savePrescriptionToBackend = async () => {
    if (!validatePrescription()) {
      return null;
    }

    if (!currentDoctor || !currentDoctor.id) {
      Alert.alert('Error', 'Doctor information not found');
      return null;
    }

    setIsSaving(true);
    try {
      const prescriptionDate = new Date().toISOString();
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const items = prescriptionData.medications
        .filter((m) => m.name && m.dosage && m.frequency && m.duration)
        .map((med) => ({
          medicineName: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          quantity: 1,
          instructions: med.instructions,
        }));

      const resp = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: String(patientId),
          doctorId: String(currentDoctor.id),
          appointmentId: appointmentId != null && String(appointmentId).trim() ? String(appointmentId) : undefined,
          diagnosis: prescriptionData.diagnosis,
          notes: prescriptionData.notes,
          prescriptionDate,
          expiryDate,
          items,
        }),
      });

      const raw = await resp.text();
      const json = (() => {
        try {
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || `Failed to save prescription (${resp.status})`);
      }

      const savedId = String(json?.data?.id ?? '').trim();
      const code = savedId ? `RX-${savedId}` : `RX-${Date.now()}`;
      setPrescriptionCode(code);
      setSavedPrescriptionId(null);
      Alert.alert('Success', 'Prescription saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (savedId) {
              onSaved?.({ id: savedId });
            } else {
              onSaved?.({ id: 'ok' });
            }
          },
        },
      ]);
      return savedId || 'ok';
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      Alert.alert('Error', error.message || 'Failed to save prescription to system');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrescription = async () => {
    await savePrescriptionToBackend();
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      {/* Header */}
      <ImageBackground 
        source={require('../../assets/images/Background-image.jpg')} 
        style={styles.headerBackground} 
        resizeMode="cover"
      >
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="file-document-edit" size={28} color="#1E4BA3" />
            </View>
            <RNText style={styles.headerTitle}>Create Prescription</RNText>
            <RNText style={styles.headerSubtitle}>Complete patient medical information</RNText>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Diagnosis */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Diagnosis</RNText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter diagnosis"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={prescriptionData.diagnosis}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, diagnosis: text })}
          />
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RNText style={styles.sectionTitle}>Medications</RNText>
            <TouchableOpacity style={styles.addButton} onPress={addMedication}>
              <Ionicons name="add-circle" size={24} color="#1E4BA3" />
              <RNText style={styles.addButtonText}>Add Medication</RNText>
            </TouchableOpacity>
          </View>

          {prescriptionData.medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationNumber}>
                  <RNText style={styles.medicationNumberText}>{index + 1}</RNText>
                </View>
                <RNText style={styles.medicationTitle}>Medication {index + 1}</RNText>
                {prescriptionData.medications.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedication(index)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <RNText style={styles.label}>Medicine Name *</RNText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Amoxicillin 500mg"
                placeholderTextColor="#9CA3AF"
                value={medication.name}
                onChangeText={(text) => updateMedication(index, 'name', text)}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <RNText style={styles.label}>Dosage *</RNText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 500mg"
                    placeholderTextColor="#9CA3AF"
                    value={medication.dosage}
                    onChangeText={(text) => updateMedication(index, 'dosage', text)}
                  />
                </View>

                <View style={styles.halfInput}>
                  <RNText style={styles.label}>Frequency *</RNText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 3 times/day"
                    placeholderTextColor="#9CA3AF"
                    value={medication.frequency}
                    onChangeText={(text) => updateMedication(index, 'frequency', text)}
                  />
                </View>
              </View>

              <RNText style={styles.label}>Duration *</RNText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7 days"
                placeholderTextColor="#9CA3AF"
                value={medication.duration}
                onChangeText={(text) => updateMedication(index, 'duration', text)}
              />

              <RNText style={styles.label}>Instructions</RNText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Take with food, after meals"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                value={medication.instructions}
                onChangeText={(text) => updateMedication(index, 'instructions', text)}
              />
            </View>
          ))}
        </View>

        {/* Additional Notes Section */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Additional Notes</RNText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions or precautions..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={prescriptionData.notes}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, notes: text })}
          />
        </View>



        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.disabledButton]} 
            onPress={handleSavePrescription}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <RNText style={styles.saveButtonText}>Save Prescription</RNText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerBackground: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: { 
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 }
    })
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 6,
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: '#6B7280',
    textAlign: 'center'
  },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 }
    })
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#1E4BA3' },
  medicationCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  medicationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  medicationNumber: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#1E4BA3', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  medicationNumberText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  medicationTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  removeButton: { padding: 4 },

  actionButtons: { marginTop: 8, gap: 12 },
  searchPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E4BA3',
  },
  searchPatientButtonText: { fontSize: 15, fontWeight: '700', color: '#1E4BA3' },
  selectedPatientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  selectedPatientText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  saveButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#1E4BA3', 
    paddingVertical: 16, 
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#1E4BA3', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  shareButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  patientResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  patientResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientResultInfo: { flex: 1 },
  patientResultName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  patientResultDetails: { fontSize: 13, color: '#6B7280' },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: { marginTop: 12, fontSize: 14, color: '#9CA3AF' },
});

