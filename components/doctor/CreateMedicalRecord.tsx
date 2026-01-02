import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

interface PatientInfo {
  name: string;
  nic: string;
  age: string;
  gender: string;
  phone: string;
  healthId: string;
}

interface VitalSigns {
  bloodPressure: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  bmi: string;
}

interface MedicalHistory {
  allergies: string;
  currentMedications: string;
  previousConditions: string;
  familyHistory: string;
}

interface CurrentVisit {
  chiefComplaint: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const COMMON_DIAGNOSES = [
  'Hypertension',
  'Type 2 Diabetes',
  'Upper Respiratory Infection',
  'Gastritis',
  'Migraine',
  'Asthma',
  'Allergic Rhinitis',
  'Lower Back Pain',
  'Anxiety Disorder',
  'Depression',
];

export default function CreateMedicalRecord() {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    nic: '',
    age: '',
    gender: '',
    phone: '',
    healthId: '',
  });

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    bloodPressure: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: '',
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    allergies: '',
    currentMedications: '',
    previousConditions: '',
    familyHistory: '',
  });

  const [currentVisit, setCurrentVisit] = useState<CurrentVisit>({
    chiefComplaint: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const [showCommonDiagnoses, setShowCommonDiagnoses] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate BMI when weight or height changes
  const calculateBMI = (weight: string, height: string) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Convert cm to m
    if (w > 0 && h > 0) {
      const bmi = (w / (h * h)).toFixed(1);
      setVitalSigns({ ...vitalSigns, weight, height, bmi });
    } else {
      setVitalSigns({ ...vitalSigns, weight, height, bmi: '' });
    }
  };

  const addCommonDiagnosis = (diagnosis: string) => {
    if (currentVisit.diagnosis) {
      setCurrentVisit({
        ...currentVisit,
        diagnosis: currentVisit.diagnosis + ', ' + diagnosis,
      });
    } else {
      setCurrentVisit({ ...currentVisit, diagnosis });
    }
  };

  const handleDocumentPicker = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        const newDocument: UploadedDocument = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size || 0,
          type: file.mimeType || 'unknown',
          uri: file.uri,
        };

        setUploadedDocuments([...uploadedDocuments, newDocument]);
        Alert.alert('Success', `${file.name} uploaded successfully`);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (documentId: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedDocuments(uploadedDocuments.filter(doc => doc.id !== documentId));
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): 'file-pdf-box' | 'file-image' | 'file-document' | 'file' => {
    if (type.includes('pdf')) return 'file-pdf-box';
    if (type.includes('image')) return 'file-image';
    if (type.includes('word') || type.includes('document')) return 'file-document';
    return 'file';
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

    if (!currentVisit.chiefComplaint.trim()) {
      Alert.alert('Validation Error', 'Please enter chief complaint');
      return false;
    }

    if (!currentVisit.diagnosis.trim()) {
      Alert.alert('Validation Error', 'Please enter diagnosis');
      return false;
    }

    return true;
  };

  const handleSaveMedicalRecord = () => {
    if (!validateForm()) return;

    const recordCode = `MR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    Alert.alert(
      'Success',
      `Medical Record Code: ${recordCode}\n\nMedical record created successfully!`,
      [
        {
          text: 'Create New Record',
          onPress: () => {
            setPatientInfo({
              name: '',
              nic: '',
              age: '',
              gender: '',
              phone: '',
              healthId: '',
            });
            setVitalSigns({
              bloodPressure: '',
              temperature: '',
              heartRate: '',
              respiratoryRate: '',
              oxygenSaturation: '',
              weight: '',
              height: '',
              bmi: '',
            });
            setMedicalHistory({
              allergies: '',
              currentMedications: '',
              previousConditions: '',
              familyHistory: '',
            });
            setCurrentVisit({
              chiefComplaint: '',
              symptoms: '',
              diagnosis: '',
              treatment: '',
              notes: '',
            });
            setUploadedDocuments([]);
          },
        },
        { text: 'Done' },
      ]
    );
  };

  const handleSaveAndPrint = () => {
    if (!validateForm()) return;

    Alert.alert(
      'Save & Print',
      'Medical record will be saved and prepared for printing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success', 'Medical record saved and sent to printer');
          },
        },
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
          <MaterialCommunityIcons name="clipboard-text" size={32} color="#1E4BA3" />
          <Text style={styles.headerTitle}>Create Medical Record</Text>
          <Text style={styles.headerSubtitle}>Complete patient medical information</Text>
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
              <Text style={styles.inputLabel}>Health ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Health ID"
                value={patientInfo.healthId}
                onChangeText={text => setPatientInfo({ ...patientInfo, healthId: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              {GENDER_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    patientInfo.gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setPatientInfo({ ...patientInfo, gender: g })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      patientInfo.gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={patientInfo.phone}
              onChangeText={text => setPatientInfo({ ...patientInfo, phone: text })}
            />
          </View>
        </View>

        {/* Vital Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>

          <View style={styles.vitalSignsGrid}>
            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#EF4444" />
              <Text style={styles.vitalSignLabel}>Blood Pressure</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="120/80"
                value={vitalSigns.bloodPressure}
                onChangeText={text =>
                  setVitalSigns({ ...vitalSigns, bloodPressure: text })
                }
              />
              <Text style={styles.vitalSignUnit}>mmHg</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="thermometer" size={24} color="#F59E0B" />
              <Text style={styles.vitalSignLabel}>Temperature</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="37.0"
                keyboardType="decimal-pad"
                value={vitalSigns.temperature}
                onChangeText={text =>
                  setVitalSigns({ ...vitalSigns, temperature: text })
                }
              />
              <Text style={styles.vitalSignUnit}>°C</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="heart" size={24} color="#EF4444" />
              <Text style={styles.vitalSignLabel}>Heart Rate</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="72"
                keyboardType="numeric"
                value={vitalSigns.heartRate}
                onChangeText={text => setVitalSigns({ ...vitalSigns, heartRate: text })}
              />
              <Text style={styles.vitalSignUnit}>bpm</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="lungs" size={24} color="#3B82F6" />
              <Text style={styles.vitalSignLabel}>Respiratory Rate</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="16"
                keyboardType="numeric"
                value={vitalSigns.respiratoryRate}
                onChangeText={text =>
                  setVitalSigns({ ...vitalSigns, respiratoryRate: text })
                }
              />
              <Text style={styles.vitalSignUnit}>breaths/min</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="water-percent" size={24} color="#10B981" />
              <Text style={styles.vitalSignLabel}>O₂ Saturation</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="98"
                keyboardType="numeric"
                value={vitalSigns.oxygenSaturation}
                onChangeText={text =>
                  setVitalSigns({ ...vitalSigns, oxygenSaturation: text })
                }
              />
              <Text style={styles.vitalSignUnit}>%</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="weight" size={24} color="#8B5CF6" />
              <Text style={styles.vitalSignLabel}>Weight</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="70"
                keyboardType="decimal-pad"
                value={vitalSigns.weight}
                onChangeText={text => calculateBMI(text, vitalSigns.height)}
              />
              <Text style={styles.vitalSignUnit}>kg</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="human-male-height" size={24} color="#6366F1" />
              <Text style={styles.vitalSignLabel}>Height</Text>
              <TextInput
                style={styles.vitalSignInput}
                placeholder="170"
                keyboardType="numeric"
                value={vitalSigns.height}
                onChangeText={text => calculateBMI(vitalSigns.weight, text)}
              />
              <Text style={styles.vitalSignUnit}>cm</Text>
            </View>

            <View style={styles.vitalSignCard}>
              <MaterialCommunityIcons name="calculator" size={24} color="#EC4899" />
              <Text style={styles.vitalSignLabel}>BMI</Text>
              <TextInput
                style={[styles.vitalSignInput, styles.vitalSignInputDisabled]}
                placeholder="Auto"
                value={vitalSigns.bmi}
                editable={false}
              />
              <Text style={styles.vitalSignUnit}>kg/m²</Text>
            </View>
          </View>
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Known Allergies</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List any known allergies (medications, food, etc.)"
              multiline
              numberOfLines={2}
              value={medicalHistory.allergies}
              onChangeText={text =>
                setMedicalHistory({ ...medicalHistory, allergies: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Medications</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="List current medications the patient is taking"
              multiline
              numberOfLines={2}
              value={medicalHistory.currentMedications}
              onChangeText={text =>
                setMedicalHistory({ ...medicalHistory, currentMedications: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Previous Conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Previous medical conditions, surgeries, hospitalizations"
              multiline
              numberOfLines={2}
              value={medicalHistory.previousConditions}
              onChangeText={text =>
                setMedicalHistory({ ...medicalHistory, previousConditions: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Family History</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Relevant family medical history"
              multiline
              numberOfLines={2}
              value={medicalHistory.familyHistory}
              onChangeText={text =>
                setMedicalHistory({ ...medicalHistory, familyHistory: text })
              }
            />
          </View>
        </View>

        {/* Current Visit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Visit</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chief Complaint *</Text>
            <TextInput
              style={styles.input}
              placeholder="Main reason for visit"
              value={currentVisit.chiefComplaint}
              onChangeText={text =>
                setCurrentVisit({ ...currentVisit, chiefComplaint: text })
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Symptoms</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed description of symptoms"
              multiline
              numberOfLines={3}
              value={currentVisit.symptoms}
              onChangeText={text => setCurrentVisit({ ...currentVisit, symptoms: text })}
            />
          </View>

          {/* Common Diagnoses */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.commonDiagnosesToggle}
              onPress={() => setShowCommonDiagnoses(!showCommonDiagnoses)}
            >
              <Text style={styles.inputLabel}>Quick Add Common Diagnoses</Text>
              <Ionicons
                name={showCommonDiagnoses ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#1E4BA3"
              />
            </TouchableOpacity>

            {showCommonDiagnoses && (
              <View style={styles.commonDiagnosesGrid}>
                {COMMON_DIAGNOSES.map((diag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.diagnosisChip}
                    onPress={() => addCommonDiagnosis(diag)}
                  >
                    <MaterialCommunityIcons
                      name="plus-circle-outline"
                      size={16}
                      color="#1E4BA3"
                    />
                    <Text style={styles.diagnosisChipText}>{diag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Diagnosis *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Medical diagnosis"
              multiline
              numberOfLines={2}
              value={currentVisit.diagnosis}
              onChangeText={text => setCurrentVisit({ ...currentVisit, diagnosis: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Treatment Plan</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Recommended treatment and management plan"
              multiline
              numberOfLines={3}
              value={currentVisit.treatment}
              onChangeText={text => setCurrentVisit({ ...currentVisit, treatment: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional observations or instructions"
              multiline
              numberOfLines={3}
              value={currentVisit.notes}
              onChangeText={text => setCurrentVisit({ ...currentVisit, notes: text })}
            />
          </View>
        </View>

        {/* Medical Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical Documents</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleDocumentPicker}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#1E4BA3" />
              ) : (
                <>
                  <MaterialCommunityIcons name="upload" size={20} color="#1E4BA3" />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionDescription}>
            Upload lab reports, X-rays, prescriptions, or other medical documents (PDF, Images, Word - Max 10MB)
          </Text>

          {uploadedDocuments.length > 0 ? (
            <View style={styles.documentsContainer}>
              {uploadedDocuments.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentIconContainer}>
                    <MaterialCommunityIcons
                      name={getFileIcon(doc.type)}
                      size={32}
                      color="#1E4BA3"
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.documentSize}>{formatFileSize(doc.size)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeDocButton}
                    onPress={() => removeDocument(doc.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDocuments}>
              <MaterialCommunityIcons name="file-upload-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyDocumentsText}>No documents uploaded yet</Text>
              <Text style={styles.emptyDocumentsSubtext}>
                Tap the upload button to add medical documents
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedicalRecord}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Save Medical Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.printButton} onPress={handleSaveAndPrint}>
            <MaterialCommunityIcons name="printer" size={22} color="#fff" />
            <Text style={styles.printButtonText}>Save & Print</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#1E4BA3" />
          <Text style={styles.infoText}>
            Medical records are securely stored and accessible to authorized healthcare
            providers. Patients can view their records through their portal.
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
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#1E4BA3',
    borderColor: '#1E4BA3',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#fff',
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  vitalSignCard: {
    width: '47.5%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 4,
  },
  vitalSignLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  vitalSignInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vitalSignInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  vitalSignUnit: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  commonDiagnosesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commonDiagnosesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  diagnosisChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1E4BA3',
    gap: 6,
  },
  diagnosisChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
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
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  printButtonText: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1E4BA3',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  documentsContainer: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeDocButton: {
    padding: 4,
  },
  emptyDocuments: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  emptyDocumentsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyDocumentsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

