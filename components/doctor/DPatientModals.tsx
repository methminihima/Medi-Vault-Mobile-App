import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Patient {
  id: string;
  name: string;
  nic: string;
  healthId: string;
  age: number;
  gender: string;
  phone: string;
  lastVisit: string;
}

interface MedicalRecord {
  diagnosis: string;
  symptoms: string;
  vitalSigns: {
    bloodPressure: string;
    temperature: string;
    heartRate: string;
    weight: string;
  };
}

interface Prescription {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes: string;
}

interface LabTest {
  testName: string;
  testType: string;
  priority: 'routine' | 'urgent' | 'stat';
  instructions: string;
}

interface DPatientModalsProps {
  selectedPatient: Patient | null;
  showPatientDashboardModal: boolean;
  setShowPatientDashboardModal: (show: boolean) => void;
  showMedicalRecordModal: boolean;
  setShowMedicalRecordModal: (show: boolean) => void;
  showPrescriptionModal: boolean;
  setShowPrescriptionModal: (show: boolean) => void;
  showLabTestModal: boolean;
  setShowLabTestModal: (show: boolean) => void;
  medicalRecord: MedicalRecord;
  setMedicalRecord: (record: MedicalRecord) => void;
  prescription: Prescription;
  setPrescription: (prescription: Prescription) => void;
  labTest: LabTest;
  setLabTest: (test: LabTest) => void;
  handleCreateMedicalRecord: () => void;
  handleIssuePrescription: () => void;
  handleOrderLabTest: () => void;
  saveMedicalRecord: () => void;
  savePrescription: () => void;
  saveLabTest: () => void;
  addMedication: () => void;
  updateMedication: (index: number, field: string, value: string) => void;
  removeMedication: (index: number) => void;
}

export default function DPatientModals({
  selectedPatient,
  showPatientDashboardModal,
  setShowPatientDashboardModal,
  showMedicalRecordModal,
  setShowMedicalRecordModal,
  showPrescriptionModal,
  setShowPrescriptionModal,
  showLabTestModal,
  setShowLabTestModal,
  medicalRecord,
  setMedicalRecord,
  prescription,
  setPrescription,
  labTest,
  setLabTest,
  handleCreateMedicalRecord,
  handleIssuePrescription,
  handleOrderLabTest,
  saveMedicalRecord,
  savePrescription,
  saveLabTest,
  addMedication,
  updateMedication,
  removeMedication,
}: DPatientModalsProps) {
  const [generatedQRCode, setGeneratedQRCode] = React.useState<string>('');
  const [showQRPreview, setShowQRPreview] = React.useState(false);

  const generatePrescriptionQRCode = () => {
    // Generate unique prescription code
    const prescriptionCode = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create prescription data object
    const prescriptionData = {
      code: prescriptionCode,
      patientNIC: selectedPatient?.nic,
      patientName: selectedPatient?.name,
      doctorName: 'Dr. ' + selectedPatient?.name, // In real app, get from user context
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      medications: prescription.medications.filter(m => m.name && m.dosage),
      notes: prescription.notes
    };

    // Convert to JSON string for QR code
    const qrData = JSON.stringify(prescriptionData);
    setGeneratedQRCode(qrData);
    setShowQRPreview(true);
  };

  const handleSavePrescriptionWithQR = () => {
    generatePrescriptionQRCode();
    setTimeout(() => {
      savePrescription();
      Alert.alert('Success', 'Prescription issued with QR code generated successfully!');
    }, 500);
  };

  return (
    <>
      {/* Patient Dashboard Modal - Main interaction point */}
      <Modal visible={showPatientDashboardModal} animationType="slide" transparent onRequestClose={() => setShowPatientDashboardModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.content, { maxHeight: '90%' }]}>
            <View style={styles.header}>
              <RNText style={styles.title}>Patient Dashboard</RNText>
              <TouchableOpacity onPress={() => setShowPatientDashboardModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPatient && (
              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientAvatar}>
                    <Ionicons name="person" size={40} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.patientName}>{selectedPatient.name}</RNText>
                    <RNText style={styles.patientDetail}>{selectedPatient.age}y • {selectedPatient.gender}</RNText>
                    <RNText style={styles.patientDetail}>NIC: {selectedPatient.nic}</RNText>
                    <RNText style={styles.patientDetail}>Health ID: {selectedPatient.healthId}</RNText>
                  </View>
                </View>

                <View style={styles.actionGrid}>
                  <TouchableOpacity style={styles.actionCard} onPress={handleCreateMedicalRecord}>
                    <MaterialCommunityIcons name="clipboard-text" size={24} color="#1E4BA3" />
                    <RNText style={styles.actionCardText}>Medical Record</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={handleIssuePrescription}>
                    <MaterialCommunityIcons name="prescription" size={24} color="#1E4BA3" />
                    <RNText style={styles.actionCardText}>Prescription</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={handleOrderLabTest}>
                    <MaterialCommunityIcons name="test-tube" size={24} color="#1E4BA3" />
                    <RNText style={styles.actionCardText}>Lab Test</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard}>
                    <MaterialCommunityIcons name="message-text" size={24} color="#1E4BA3" />
                    <RNText style={styles.actionCardText}>Message</RNText>
                  </TouchableOpacity>
                </View>

                <RNText style={styles.summaryTitle}>Health Summary</RNText>
                {[
                  ['Last Visit:', selectedPatient.lastVisit],
                  ['Phone:', selectedPatient.phone],
                  ['Total Visits:', '12'],
                  ['Active Prescriptions:', '2']
                ].map(([label, value], i) => (
                  <View key={i} style={styles.summaryCard}>
                    <RNText style={styles.summaryLabel}>{label}</RNText>
                    <RNText style={styles.summaryValue}>{value}</RNText>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Medical Record Modal */}
      <Modal visible={showMedicalRecordModal} animationType="slide" transparent onRequestClose={() => setShowMedicalRecordModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.content, { maxHeight: '90%' }]}>
            <View style={styles.header}>
              <RNText style={styles.title}>Create Medical Record</RNText>
              <TouchableOpacity onPress={() => setShowMedicalRecordModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body}>
              <RNText style={styles.label}>Diagnosis *</RNText>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Enter diagnosis" placeholderTextColor="#9CA3AF"
                value={medicalRecord.diagnosis} onChangeText={(text) => setMedicalRecord({ ...medicalRecord, diagnosis: text })} multiline />

              <RNText style={styles.label}>Symptoms *</RNText>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Enter symptoms" placeholderTextColor="#9CA3AF"
                value={medicalRecord.symptoms} onChangeText={(text) => setMedicalRecord({ ...medicalRecord, symptoms: text })} multiline />

              <RNText style={styles.sectionTitle}>Vital Signs</RNText>
              {[
                ['Blood Pressure', 'bloodPressure', '120/80 mmHg'],
                ['Temperature', 'temperature', '98.6°F'],
                ['Heart Rate', 'heartRate', '72 bpm'],
                ['Weight', 'weight', '70 kg']
              ].map(([label, key, placeholder]) => (
                <View key={key}>
                  <RNText style={styles.label}>{label}</RNText>
                  <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#9CA3AF"
                    value={medicalRecord.vitalSigns[key as keyof typeof medicalRecord.vitalSigns]}
                    onChangeText={(text) => setMedicalRecord({ ...medicalRecord, vitalSigns: { ...medicalRecord.vitalSigns, [key]: text } })} />
                </View>
              ))}

              <TouchableOpacity style={styles.saveButton} onPress={saveMedicalRecord}>
                <RNText style={styles.saveButtonText}>Save Medical Record</RNText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Prescription Modal */}
      <Modal visible={showPrescriptionModal} animationType="slide" transparent onRequestClose={() => setShowPrescriptionModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.content, { maxHeight: '90%' }]}>
            <View style={styles.header}>
              <RNText style={styles.title}>Issue Prescription</RNText>
              <TouchableOpacity onPress={() => setShowPrescriptionModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body}>
              <View style={styles.qrInfo}>
                <MaterialCommunityIcons name="qrcode" size={32} color="#1E4BA3" />
                <RNText style={styles.qrText}>QR code will be generated automatically</RNText>
              </View>

              {prescription.medications.map((med, index) => (
                <View key={index} style={styles.medicationCard}>
                  <View style={styles.medicationHeader}>
                    <RNText style={styles.medicationTitle}>Medication {index + 1}</RNText>
                    {prescription.medications.length > 1 && (
                      <TouchableOpacity onPress={() => removeMedication(index)}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {[
                    ['Medicine Name *', 'name', 'Amoxicillin'],
                    ['Dosage *', 'dosage', '500mg'],
                    ['Frequency *', 'frequency', '3 times daily'],
                    ['Duration *', 'duration', '7 days']
                  ].map(([label, field, placeholder]) => (
                    <View key={field}>
                      <RNText style={styles.label}>{label}</RNText>
                      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor="#9CA3AF"
                        value={med[field as keyof typeof med]} onChangeText={(text) => updateMedication(index, field, text)} />
                    </View>
                  ))}
                </View>
              ))}

              <TouchableOpacity style={styles.addButton} onPress={addMedication}>
                <Ionicons name="add-circle-outline" size={20} color="#1E4BA3" />
                <RNText style={styles.addButtonText}>Add Another Medication</RNText>
              </TouchableOpacity>

              <RNText style={styles.label}>Additional Notes</RNText>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Any special instructions..." placeholderTextColor="#9CA3AF"
                value={prescription.notes} onChangeText={(text) => setPrescription({ ...prescription, notes: text })} multiline />

              {showQRPreview && generatedQRCode && (
                <View style={styles.qrPreviewContainer}>
                  <RNText style={styles.qrPreviewTitle}>Generated QR Code Preview</RNText>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={generatedQRCode}
                      size={200}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>
                  <RNText style={styles.qrPreviewNote}>This QR code will be included in the prescription</RNText>
                </View>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSavePrescriptionWithQR}>
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
                <RNText style={[styles.saveButtonText, { marginLeft: 8 }]}>Issue Prescription with QR</RNText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lab Test Modal */}
      <Modal visible={showLabTestModal} animationType="slide" transparent onRequestClose={() => setShowLabTestModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.content, { maxHeight: '80%' }]}>
            <View style={styles.header}>
              <RNText style={styles.title}>Order Lab Test</RNText>
              <TouchableOpacity onPress={() => setShowLabTestModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body}>
              <RNText style={styles.label}>Test Name *</RNText>
              <TextInput style={styles.input} placeholder="Complete Blood Count (CBC)" placeholderTextColor="#9CA3AF"
                value={labTest.testName} onChangeText={(text) => setLabTest({ ...labTest, testName: text })} />

              <RNText style={styles.label}>Test Type *</RNText>
              <TextInput style={styles.input} placeholder="Hematology, Chemistry" placeholderTextColor="#9CA3AF"
                value={labTest.testType} onChangeText={(text) => setLabTest({ ...labTest, testType: text })} />

              <RNText style={styles.label}>Priority *</RNText>
              <View style={styles.priorityContainer}>
                {(['routine', 'urgent', 'stat'] as const).map(priority => (
                  <TouchableOpacity key={priority}
                    style={[styles.priorityButton, labTest.priority === priority && { backgroundColor: priority === 'routine' ? '#1E4BA3' : priority === 'urgent' ? '#F59E0B' : '#EF4444' }]}
                    onPress={() => setLabTest({ ...labTest, priority })}>
                    <RNText style={[styles.priorityText, labTest.priority === priority && { color: '#fff' }]}>
                      {priority.toUpperCase()}
                    </RNText>
                  </TouchableOpacity>
                ))}
              </View>

              <RNText style={styles.label}>Special Instructions</RNText>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Any special instructions..." placeholderTextColor="#9CA3AF"
                value={labTest.instructions} onChangeText={(text) => setLabTest({ ...labTest, instructions: text })} multiline />

              <TouchableOpacity style={styles.saveButton} onPress={saveLabTest}>
                <RNText style={styles.saveButtonText}>Order Lab Test</RNText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  body: {
    padding: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  patientAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  patientDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    flexDirection: 'row',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  qrInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6f7fb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  qrText: {
    flex: 1,
    fontSize: 13,
    color: '#1E4BA3',
    fontWeight: '600',
  },
  qrPreviewContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E4BA3',
    borderStyle: 'dashed',
  },
  qrPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrPreviewNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#e6f7fb',
    borderRadius: 10,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});

