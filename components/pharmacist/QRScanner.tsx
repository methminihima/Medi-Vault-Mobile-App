import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import React from 'react';
import {
    Alert,
    Dimensions,
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScannedPrescription {
  id: string;
  qrCode: string;
  patientName: string;
  patientNIC: string;
  patientAge: number;
  doctorName: string;
  doctorLicense: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }>;
  issueDate: string;
  validUntil: string;
  status: 'verified' | 'pending' | 'expired';
  allergies?: string[];
  specialInstructions?: string;
}

interface QRScannerProps {
  onBack?: () => void;
}

export default function QRScanner({ onBack }: QRScannerProps) {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedPrescription, setScannedPrescription] = React.useState<ScannedPrescription | null>(null);
  const [scanHistory, setScanHistory] = React.useState<Array<{ code: string; time: string; status: string }>>([
    { code: 'RX-2025-001', time: '10:30 AM', status: 'verified' },
    { code: 'RX-2025-002', time: '11:15 AM', status: 'verified' },
    { code: 'RX-2025-003', time: '02:45 PM', status: 'pending' },
  ]);

  React.useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleStartScan = async () => {
    if (hasPermission === null) {
      Alert.alert('Camera Permission', 'Requesting camera permission...');
      await getCameraPermissions();
      return;
    }
    
    if (hasPermission === false) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission in your device settings to scan QR codes.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    
    // Parse the scanned QR code data
    // In production, this would validate against your backend
    const mockPrescription: ScannedPrescription = {
        id: '1',
        qrCode: 'RX-2025-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        patientName: 'John Doe',
        patientNIC: '199512345678',
        patientAge: 30,
        doctorName: 'Dr. Sarah Johnson',
        doctorLicense: 'MD-12345',
        medications: [
          {
            name: 'Amoxicillin 500mg',
            dosage: '500mg',
            frequency: '3 times daily',
            duration: '7 days',
            quantity: 21,
            instructions: 'Take with food'
          },
          {
            name: 'Paracetamol 500mg',
            dosage: '500mg',
            frequency: 'Every 6 hours as needed',
            duration: '5 days',
            quantity: 20,
            instructions: 'For fever or pain'
          }
        ],
        issueDate: '2024-12-03',
        validUntil: '2024-12-10',
        status: 'verified',
        allergies: ['Penicillin alternatives'],
        specialInstructions: 'Patient has mild lactose intolerance. Advise to take probiotics.'
      };

    // Use the actual scanned data
    mockPrescription.qrCode = data;

    setScannedPrescription(mockPrescription);
    
    // Add to scan history
    setScanHistory(prev => [
      { code: data, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), status: 'verified' },
      ...prev
    ]);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
  };

  const handleVerifyPrescription = () => {
    Alert.alert(
      'Verify Prescription',
      'Prescription verified successfully! Proceed to dispense medications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispense',
          onPress: () => {
            Alert.alert('Success', 'Prescription marked for dispensing');
            setScannedPrescription(null);
          }
        }
      ]
    );
  };

  const handleClearScan = () => {
    setScannedPrescription(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <RNText style={styles.headerTitle}>QR Code Scanner</RNText>
          <RNText style={styles.headerSubtitle}>Scan prescription QR codes for verification</RNText>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Scanner Section */}
        <View style={styles.scannerSection}>
          <View style={styles.scannerCard}>
            {isScanning ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={handleBarCodeScanned}
                >
                  <View style={styles.cameraOverlay}>
                    <View style={styles.scannerFrame}>
                      <View style={[styles.corner, styles.cornerTopLeft]} />
                      <View style={[styles.corner, styles.cornerTopRight]} />
                      <View style={[styles.corner, styles.cornerBottomLeft]} />
                      <View style={[styles.corner, styles.cornerBottomRight]} />
                    </View>
                    <View style={styles.scanningTextContainer}>
                      <RNText style={styles.scanningText}>Scanning QR Code...</RNText>
                      <RNText style={styles.scanningSubtext}>Position the QR code within the frame</RNText>
                    </View>
                    <TouchableOpacity style={styles.cancelScanButton} onPress={handleStopScanning}>
                      <Ionicons name="close-circle" size={24} color="#fff" />
                      <RNText style={styles.cancelScanText}>Cancel</RNText>
                    </TouchableOpacity>
                  </View>
                </CameraView>
              </View>
            ) : scannedPrescription ? (
              <View style={styles.prescriptionDetails}>
                {/* Status Badge */}
                <View style={[styles.statusHeader, { backgroundColor: `${getStatusColor(scannedPrescription.status)}15` }]}>
                  <Ionicons 
                    name={scannedPrescription.status === 'verified' ? 'checkmark-circle' : 'alert-circle'} 
                    size={24} 
                    color={getStatusColor(scannedPrescription.status)} 
                  />
                  <RNText style={[styles.statusText, { color: getStatusColor(scannedPrescription.status) }]}>
                    {scannedPrescription.status.toUpperCase()}
                  </RNText>
                </View>

                {/* Prescription Code */}
                <View style={styles.codeSection}>
                  <MaterialCommunityIcons name="qrcode" size={32} color="#3B82F6" />
                  <RNText style={styles.prescriptionCode}>{scannedPrescription.qrCode}</RNText>
                </View>

                {/* Patient Information */}
                <View style={styles.section}>
                  <RNText style={styles.sectionTitle}>Patient Information</RNText>
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={18} color="#6B7280" />
                    <RNText style={styles.infoLabel}>Name:</RNText>
                    <RNText style={styles.infoValue}>{scannedPrescription.patientName}</RNText>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="card" size={18} color="#6B7280" />
                    <RNText style={styles.infoLabel}>NIC:</RNText>
                    <RNText style={styles.infoValue}>{scannedPrescription.patientNIC}</RNText>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={18} color="#6B7280" />
                    <RNText style={styles.infoLabel}>Age:</RNText>
                    <RNText style={styles.infoValue}>{scannedPrescription.patientAge} years</RNText>
                  </View>
                </View>

                {/* Doctor Information */}
                <View style={styles.section}>
                  <RNText style={styles.sectionTitle}>Prescribing Doctor</RNText>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="doctor" size={18} color="#6B7280" />
                    <RNText style={styles.infoLabel}>Name:</RNText>
                    <RNText style={styles.infoValue}>{scannedPrescription.doctorName}</RNText>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="certificate" size={18} color="#6B7280" />
                    <RNText style={styles.infoLabel}>License:</RNText>
                    <RNText style={styles.infoValue}>{scannedPrescription.doctorLicense}</RNText>
                  </View>
                </View>

                {/* Medications */}
                <View style={styles.section}>
                  <RNText style={styles.sectionTitle}>Prescribed Medications</RNText>
                  {scannedPrescription.medications.map((med, index) => (
                    <View key={index} style={styles.medicationCard}>
                      <View style={styles.medicationHeader}>
                        <MaterialCommunityIcons name="pill" size={20} color="#3B82F6" />
                        <RNText style={styles.medicationName}>{med.name}</RNText>
                      </View>
                      <View style={styles.medicationDetails}>
                        <View style={styles.medicationDetailRow}>
                          <RNText style={styles.detailLabel}>Dosage:</RNText>
                          <RNText style={styles.detailValue}>{med.dosage}</RNText>
                        </View>
                        <View style={styles.medicationDetailRow}>
                          <RNText style={styles.detailLabel}>Frequency:</RNText>
                          <RNText style={styles.detailValue}>{med.frequency}</RNText>
                        </View>
                        <View style={styles.medicationDetailRow}>
                          <RNText style={styles.detailLabel}>Duration:</RNText>
                          <RNText style={styles.detailValue}>{med.duration}</RNText>
                        </View>
                        <View style={styles.medicationDetailRow}>
                          <RNText style={styles.detailLabel}>Quantity:</RNText>
                          <RNText style={styles.detailValue}>{med.quantity} units</RNText>
                        </View>
                        <View style={styles.instructionsBox}>
                          <Ionicons name="information-circle" size={16} color="#3B82F6" />
                          <RNText style={styles.instructionsText}>{med.instructions}</RNText>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Allergies */}
                {scannedPrescription.allergies && scannedPrescription.allergies.length > 0 && (
                  <View style={[styles.section, styles.warningSection]}>
                    <View style={styles.warningHeader}>
                      <MaterialCommunityIcons name="alert" size={20} color="#EF4444" />
                      <RNText style={styles.warningTitle}>Known Allergies</RNText>
                    </View>
                    {scannedPrescription.allergies.map((allergy, index) => (
                      <RNText key={index} style={styles.allergyText}>• {allergy}</RNText>
                    ))}
                  </View>
                )}

                {/* Special Instructions */}
                {scannedPrescription.specialInstructions && (
                  <View style={styles.section}>
                    <RNText style={styles.sectionTitle}>Special Instructions</RNText>
                    <View style={styles.instructionsBox}>
                      <Ionicons name="clipboard" size={16} color="#8B5CF6" />
                      <RNText style={styles.specialInstructionsText}>{scannedPrescription.specialInstructions}</RNText>
                    </View>
                  </View>
                )}

                {/* Validity */}
                <View style={styles.validitySection}>
                  <View style={styles.validityItem}>
                    <RNText style={styles.validityLabel}>Issue Date</RNText>
                    <RNText style={styles.validityValue}>{scannedPrescription.issueDate}</RNText>
                  </View>
                  <View style={styles.validityItem}>
                    <RNText style={styles.validityLabel}>Valid Until</RNText>
                    <RNText style={styles.validityValue}>{scannedPrescription.validUntil}</RNText>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.clearButton} onPress={handleClearScan}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                    <RNText style={styles.clearButtonText}>Clear</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyPrescription}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <RNText style={styles.verifyButtonText}>Verify & Dispense</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.scanPrompt}>
                <View style={styles.qrIconContainer}>
                  <MaterialCommunityIcons name="qrcode-scan" size={100} color="#3B82F6" />
                </View>
                <RNText style={styles.promptTitle}>
                  {hasPermission === false ? 'Camera Permission Required' : 'Ready to Scan'}
                </RNText>
                <RNText style={styles.promptText}>
                  {hasPermission === false 
                    ? 'Please grant camera permission to scan prescription QR codes. You can enable this in your device settings.'
                    : 'Tap the button below to start scanning prescription QR codes'}
                </RNText>
                <TouchableOpacity style={styles.scanButton} onPress={handleStartScan}>
                  <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                  <RNText style={styles.scanButtonText}>
                    {hasPermission === false ? 'Request Permission' : 'Start Scanning'}
                  </RNText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={styles.historySection}>
          <RNText style={styles.historyTitle}>Recent Scans</RNText>
          {scanHistory.map((scan, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <MaterialCommunityIcons name="qrcode" size={20} color="#6B7280" />
                <RNText style={styles.historyCode}>{scan.code}</RNText>
              </View>
              <View style={styles.historyRight}>
                <RNText style={styles.historyTime}>{scan.time}</RNText>
                <View style={[styles.historyStatusBadge, { backgroundColor: `${getStatusColor(scan.status)}15` }]}>
                  <RNText style={[styles.historyStatusText, { color: getStatusColor(scan.status) }]}>
                    {scan.status.toUpperCase()}
                  </RNText>
                </View>
              </View>
            </View>
          ))}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 }
    })
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  scannerSection: { marginBottom: 24 },
  scannerCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24,
    minHeight: 300,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  cameraContainer: { 
    width: '100%', 
    height: 500, 
    borderRadius: 16, 
    overflow: 'hidden',
    backgroundColor: '#000'
  },
  camera: { 
    flex: 1 
  },
  cameraOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  scannerFrame: { 
    width: 250, 
    height: 250, 
    position: 'relative',
    marginTop: 40
  },
  corner: { 
    position: 'absolute', 
    width: 50, 
    height: 50, 
    borderColor: '#fff', 
    borderWidth: 4 
  },
  cornerTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningTextContainer: { alignItems: 'center', paddingHorizontal: 20 },
  scanningText: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  scanningSubtext: { fontSize: 14, color: '#E5E7EB', textAlign: 'center' },
  cancelScanButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(239, 68, 68, 0.9)', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 12,
    marginBottom: 20
  },
  cancelScanText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scanPrompt: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  qrIconContainer: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: '#EFF6FF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  promptTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  promptText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  scanButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#3B82F6', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  scanButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  prescriptionDetails: { },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 16 },
  statusText: { fontSize: 16, fontWeight: '700' },
  codeSection: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 20 },
  prescriptionCode: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  section: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', width: 70 },
  infoValue: { fontSize: 14, color: '#1F2937', flex: 1 },
  medicationCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12 },
  medicationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  medicationName: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  medicationDetails: { },
  medicationDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  detailValue: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  instructionsBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 8 },
  instructionsText: { fontSize: 12, color: '#374151', flex: 1, lineHeight: 18 },
  warningSection: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', borderWidth: 1, padding: 12, borderRadius: 12 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  allergyText: { fontSize: 13, color: '#DC2626', marginLeft: 28, marginBottom: 4 },
  specialInstructionsText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
  validitySection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  validityItem: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, alignItems: 'center' },
  validityLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  validityValue: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  clearButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#F3F4F6', 
    paddingVertical: 14, 
    borderRadius: 12 
  },
  clearButtonText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  verifyButton: { 
    flex: 2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#10B981', 
    paddingVertical: 14, 
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  verifyButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  historySection: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 }
    })
  },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyCode: { fontSize: 14, fontWeight: '600', color: '#374151' },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyTime: { fontSize: 12, color: '#6B7280' },
  historyStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyStatusText: { fontSize: 10, fontWeight: '700' },
});

