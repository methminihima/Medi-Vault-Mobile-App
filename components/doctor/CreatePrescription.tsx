import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { patientsApi } from '../../src/api/patients';
import { prescriptionsApi } from '../../src/api/prescriptions';
import { storageService } from '../../src/services/storageService';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  patientName: string;
  patientNIC: string;
  patientAge: string;
  patientPhone: string;
  medications: Medication[];
  diagnosis: string;
  notes: string;
}

export default function CreatePrescription() {
  const [prescriptionData, setPrescriptionData] = React.useState<PrescriptionData>({
    patientName: '',
    patientNIC: '',
    patientAge: '',
    patientPhone: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    diagnosis: '',
    notes: ''
  });

  const [prescriptionCode, setPrescriptionCode] = React.useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = React.useState<number | null>(null);
  const [searchModalVisible, setSearchModalVisible] = React.useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
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

  const searchPatients = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await patientsApi.getPatients({ search: query, limit: 10 });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      Alert.alert('Error', 'Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatient = (patient: any) => {
    setPrescriptionData({
      ...prescriptionData,
      patientName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      patientNIC: patient.nic || '',
      patientAge: patient.dateOfBirth ? String(new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()) : '',
      patientPhone: patient.phone || '',
    });
    setSelectedPatientId(patient.id);
    setSearchModalVisible(false);
    setPatientSearchQuery('');
    setSearchResults([]);
  };

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
    // Validate required fields
    if (!prescriptionData.patientName || !prescriptionData.patientNIC) {
      Alert.alert('Validation Error', 'Patient name and NIC are required');
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

  const generatePrescriptionHTML = (code: string, issueDate: string, validUntil: string, doctorName: string): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 15mm;
          }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: white;
          }
          .prescription-pad {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 0;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin: 0;
            letter-spacing: 2px;
          }
          .doctor-name {
            font-size: 16px;
            margin: 5px 0 3px 0;
            font-weight: normal;
          }
          .credentials {
            font-size: 12px;
            color: #333;
            margin: 2px 0;
          }
          .contact-info {
            font-size: 11px;
            color: #555;
            margin-top: 5px;
          }
          .rx-header {
            margin: 20px 0 10px 0;
            overflow: hidden;
          }
          .rx-number {
            float: left;
            font-size: 11px;
            color: #666;
          }
          .rx-date {
            float: right;
            font-size: 12px;
          }
          .patient-section {
            margin: 15px 0;
            padding: 8px 0;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
          }
          .patient-row {
            margin: 5px 0;
            font-size: 13px;
          }
          .patient-label {
            display: inline-block;
            width: 100px;
            font-weight: bold;
          }
          .diagnosis {
            margin: 15px 0;
            font-size: 13px;
          }
          .diagnosis strong {
            text-decoration: underline;
          }
          .rx-symbol {
            font-size: 56px;
            font-weight: bold;
            margin: 20px 0 15px 0;
            color: #000;
            font-family: Georgia, serif;
          }
          .medications {
            margin: 20px 0;
            min-height: 300px;
          }
          .med-item {
            margin: 15px 0;
            font-size: 14px;
            line-height: 1.8;
          }
          .med-name {
            font-weight: bold;
            font-size: 15px;
          }
          .med-sig {
            margin-left: 25px;
            font-size: 13px;
          }
          .advice {
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.6;
          }
          .advice strong {
            text-decoration: underline;
          }
          .validity {
            margin-top: 20px;
            font-size: 11px;
            color: #666;
            font-style: italic;
          }
          .signature-block {
            margin-top: 80px;
            text-align: right;
            padding-right: 30px;
          }
          .signature-line {
            border-top: 1.5px solid #000;
            width: 180px;
            margin: 50px 0 8px auto;
          }
          .doctor-signature {
            font-size: 14px;
            font-weight: bold;
          }
          .doctor-reg {
            font-size: 11px;
            color: #555;
          }
          .footer {
            position: fixed;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #ccc;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="prescription-pad">
          <!-- Header -->
          <div class="header">
            <div class="clinic-name">MEDI VAULT MEDICAL CENTER</div>
            <div class="doctor-name">${doctorName}</div>
            <div class="credentials">MBBS, MD (General Medicine) | Reg. No: REG-2024-XXXX</div>
            <div class="contact-info">
              123 Medical Avenue, Colombo 07, Sri Lanka | Tel: +94 11 234 5678
            </div>
          </div>

          <!-- Prescription Number & Date -->
          <div class="rx-header">
            <div class="rx-number">Rx No: ${code}</div>
            <div class="rx-date">Date: ${new Date(issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>

          <!-- Patient Information -->
          <div class="patient-section">
            <div class="patient-row">
              <span class="patient-label">Name:</span>
              <span>${prescriptionData.patientName}</span>
            </div>
            <div class="patient-row">
              <span class="patient-label">Age/Sex:</span>
              <span>${prescriptionData.patientAge || 'N/A'} / N/A</span>
              <span style="margin-left: 50px;">
                <span class="patient-label">NIC:</span>
                ${prescriptionData.patientNIC}
              </span>
            </div>
            ${prescriptionData.patientPhone ? `
            <div class="patient-row">
              <span class="patient-label">Contact:</span>
              <span>${prescriptionData.patientPhone}</span>
            </div>
            ` : ''}
          </div>

          <!-- Diagnosis -->
          ${prescriptionData.diagnosis ? `
          <div class="diagnosis">
            <strong>Diagnosis:</strong> ${prescriptionData.diagnosis}
          </div>
          ` : ''}

          <!-- Rx Symbol -->
          <div class="rx-symbol">℞</div>

          <!-- Medications -->
          <div class="medications">
            ${prescriptionData.medications.filter(m => m.name && m.dosage).map((med, index) => `
            <div class="med-item">
              <div class="med-name">${index + 1}. Tab. ${med.name}</div>
              <div class="med-sig">
                ${med.dosage} - ${med.frequency} - ${med.duration}
                ${med.instructions ? `<br><em>${med.instructions}</em>` : ''}
              </div>
            </div>
            `).join('')}
          </div>

          <!-- Additional Advice -->
          ${prescriptionData.notes ? `
          <div class="advice">
            <strong>Advice:</strong><br>
            ${prescriptionData.notes}
          </div>
          ` : ''}

          <!-- Validity -->
          <div class="validity">
            Valid until: ${new Date(validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>

          <!-- Signature -->
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="doctor-signature">${doctorName}</div>
            <div class="doctor-reg">MBBS, MD | Reg. No: REG-2024-XXXX</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            This is a computer-generated prescription | For verification: +94 11 234 5678
          </div>
        </div>
      </body>
    </html>
    `;
  };

  const generatePrescriptionPDF = async () => {
    if (!validatePrescription()) {
      return;
    }

    const code = prescriptionCode || `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    if (!prescriptionCode) {
      setPrescriptionCode(code);
    }
    
    const issueDate = new Date().toISOString().split('T')[0];
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const doctorName = currentDoctor ? `Dr. ${currentDoctor.firstName} ${currentDoctor.lastName}` : 'Dr. [Current Doctor]';

    const html = generatePrescriptionHTML(code, issueDate, validUntil, doctorName);

    try {
      // First show user what they want to do
      Alert.alert(
        'Generate Prescription',
        'Choose an action for the prescription PDF:',
        [
          {
            text: 'Print',
            onPress: async () => {
              try {
                await Print.printAsync({ html });
              } catch (error) {
                console.error('Print error:', error);
                Alert.alert('Error', 'Failed to print. Please try again.');
              }
            }
          },
          {
            text: 'Save & Share',
            onPress: async () => {
              try {
                const { uri } = await Print.printToFileAsync({ 
                  html,
                  base64: false 
                });
                await shareAsync(uri, { 
                  UTI: '.pdf', 
                  mimeType: 'application/pdf' 
                });
              } catch (error) {
                console.error('Share error:', error);
                Alert.alert('Error', 'Failed to save/share PDF. Please try again.');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      
      // Reset form option after successful generation
      setTimeout(() => {
        Alert.alert(
          'Create New Prescription?',
          'Would you like to create another prescription?',
          [
            {
              text: 'Yes',
              onPress: () => {
                setPrescriptionData({
                  patientName: '',
                  patientNIC: '',
                  patientAge: '',
                  patientPhone: '',
                  medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                  diagnosis: '',
                  notes: ''
                });
                setPrescriptionCode('');
                setSelectedPatientId(null);
                setSavedPrescriptionId(null);
              }
            },
            { text: 'No', style: 'cancel' }
          ]
        );
      }, 500);
    } catch (error) {
      console.error('Error generating prescription:', error);
      Alert.alert('Error', 'Failed to generate prescription. Please try again.');
    }
  };

  const savePrescriptionToBackend = async () => {
    if (!validatePrescription()) {
      return null;
    }

    if (!selectedPatientId) {
      Alert.alert('Error', 'Please select a patient from the system');
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

      // Note: This is a simplified version. In a real app, you'd need to:
      // 1. Get actual medicine IDs from the system
      // 2. Calculate quantities properly
      // For now, we'll use dummy medicine IDs
      const prescriptionDto = {
        patientId: selectedPatientId,
        doctorId: currentDoctor.id,
        prescriptionDate,
        expiryDate,
        instructions: prescriptionData.notes,
        items: prescriptionData.medications
          .filter(m => m.name && m.dosage && m.frequency && m.duration)
          .map((med) => ({
            medicineId: 1, // TODO: Get real medicine ID from medicine search
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            quantity: 30, // TODO: Calculate based on duration and frequency
            instructions: med.instructions
          }))
      };

      const response = await prescriptionsApi.createPrescription(prescriptionDto);
      
      if (response.success && response.data) {
        const code = `RX-${response.data.id}-${Date.now().toString().slice(-6)}`;
        setPrescriptionCode(code);
        setSavedPrescriptionId(response.data.id);
        Alert.alert('Success', 'Prescription saved successfully!');
        return response.data.id;
      } else {
        throw new Error('Failed to save prescription');
      }
    } catch (error: any) {
      console.error('Error saving prescription:', error);
      Alert.alert('Error', error.message || 'Failed to save prescription to system');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrescription = async () => {
    // Save to backend first
    const prescriptionId = await savePrescriptionToBackend();
    if (prescriptionId) {
      // Then generate PDF
      await generatePrescriptionPDF();
    }
  };

  const handleSharePrescription = async () => {
    // Ensure prescription is saved first
    let prescriptionId = savedPrescriptionId;
    if (!prescriptionId) {
      prescriptionId = await savePrescriptionToBackend();
      if (!prescriptionId) return;
    }

    // Generate and share PDF
    if (!validatePrescription()) return;

    try {
      const code = prescriptionCode || `RX-${prescriptionId}-${Date.now().toString().slice(-6)}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const doctorName = currentDoctor ? `Dr. ${currentDoctor.firstName} ${currentDoctor.lastName}` : 'Dr. [Current Doctor]';

      const html = generatePrescriptionHTML(code, issueDate, validUntil, doctorName);

      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      await shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf',
        dialogTitle: `Share Prescription for ${prescriptionData.patientName}`
      });
      
      Alert.alert('Success', 'Prescription shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share prescription. Please try again.');
    }
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
        {/* Patient Information Section */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Patient Information</RNText>
          
          <RNText style={styles.label}>Patient Name *</RNText>
          <TextInput
            style={styles.input}
            placeholder="Enter patient full name"
            placeholderTextColor="#9CA3AF"
            value={prescriptionData.patientName}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientName: text })}
          />

          <RNText style={styles.label}>Patient NIC *</RNText>
          <TextInput
            style={styles.input}
            placeholder="Enter patient NIC number"
            placeholderTextColor="#9CA3AF"
            value={prescriptionData.patientNIC}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientNIC: text })}
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <RNText style={styles.label}>Age</RNText>
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={prescriptionData.patientAge}
                onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientAge: text })}
              />
            </View>

            <View style={styles.halfInput}>
              <RNText style={styles.label}>Phone</RNText>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={prescriptionData.patientPhone}
                onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientPhone: text })}
              />
            </View>
          </View>

          <RNText style={styles.label}>Diagnosis</RNText>
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
            style={styles.searchPatientButton} 
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search" size={20} color="#1E4BA3" />
            <RNText style={styles.searchPatientButtonText}>Search Patient in System</RNText>
          </TouchableOpacity>

          {selectedPatientId && (
            <View style={styles.selectedPatientBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <RNText style={styles.selectedPatientText}>Patient selected from system</RNText>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.disabledButton]} 
            onPress={handleSavePrescription}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                <RNText style={styles.saveButtonText}>Save & Generate PDF</RNText>
              </>
            )}
          </TouchableOpacity>

          {savedPrescriptionId && (
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={handleSharePrescription}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <RNText style={styles.shareButtonText}>Share to Patient</RNText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Patient Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Search Patient</RNText>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or NIC..."
              placeholderTextColor="#9CA3AF"
              value={patientSearchQuery}
              onChangeText={(text) => {
                setPatientSearchQuery(text);
                searchPatients(text);
              }}
              autoFocus
            />

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E4BA3" />
                <RNText style={styles.loadingText}>Searching...</RNText>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.patientResultItem}
                    onPress={() => selectPatient(item)}
                  >
                    <View style={styles.patientResultIcon}>
                      <Ionicons name="person" size={24} color="#1E4BA3" />
                    </View>
                    <View style={styles.patientResultInfo}>
                      <RNText style={styles.patientResultName}>
                        {item.fullName || `${item.firstName} ${item.lastName}`}
                      </RNText>
                      <RNText style={styles.patientResultDetails}>
                        NIC: {item.nic} | Phone: {item.phone}
                      </RNText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  patientSearchQuery.length >= 2 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="search" size={48} color="#D1D5DB" />
                      <RNText style={styles.emptyStateText}>No patients found</RNText>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="people" size={48} color="#D1D5DB" />
                      <RNText style={styles.emptyStateText}>Type to search patients</RNText>
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
      </Modal>
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

