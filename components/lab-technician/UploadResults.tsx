import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    Modal,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LabTest {
  id: string;
  patientName: string;
  patientNIC: string;
  testName: string;
  status: 'in_progress';
  priority: 'routine' | 'urgent' | 'stat';
  doctorName: string;
}

export default function UploadResults() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [testResults, setTestResults] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [resultNotes, setResultNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const [testsInProgress] = useState<LabTest[]>([
    {
      id: '1',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      testName: 'Urinalysis',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Johnson',
    },
    {
      id: '2',
      patientName: 'Emily Davis',
      patientNIC: '321654987V',
      testName: 'Chest X-Ray',
      status: 'in_progress',
      priority: 'urgent',
      doctorName: 'Dr. Martinez',
    },
    {
      id: '3',
      patientName: 'Robert Wilson',
      patientNIC: '654987321V',
      testName: 'Thyroid Function Test',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Brown',
    },
  ]);

  const handleUpload = (test: LabTest) => {
    setSelectedTest(test);
    setTestResults('');
    setIsAbnormal(false);
    setResultNotes('');
    setShowUploadModal(true);
  };

  const saveResults = () => {
    if (!testResults.trim()) {
      Alert.alert('Error', 'Please enter test results');
      return;
    }

    Alert.alert(
      'Success',
      `Results uploaded successfully!\n${isAbnormal ? 'Abnormal results flagged.\n' : ''}Notifications sent to Dr. ${selectedTest?.doctorName} and ${selectedTest?.patientName}.`
    );

    setShowUploadModal(false);
    setSelectedTest(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return '#EF4444';
      case 'urgent': return '#F59E0B';
      case 'routine': default: return '#10B981';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Upload Test Results</RNText>
        <RNText style={styles.headerSubtitle}>{testsInProgress.length} tests ready for results</RNText>
      </View>

      <ScrollView
        style={styles.testsList}
        contentContainerStyle={styles.testsContent}
        showsVerticalScrollIndicator={false}
      >
        {testsInProgress.map(test => (
          <View key={test.id} style={styles.testCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(test.priority) }]} />
              <View style={styles.testIconWrapper}>
                <MaterialCommunityIcons name="test-tube" size={28} color="#1E4BA3" />
              </View>
            </View>
            <View style={styles.testInfo}>
              <View style={styles.testHeader}>
                <View style={styles.testDetails}>
                  <RNText style={styles.testName}>{test.testName}</RNText>
                  <View style={styles.patientRow}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <RNText style={styles.patientName}>{test.patientName}</RNText>
                  </View>
                  <View style={styles.nicRow}>
                    <Ionicons name="card-outline" size={14} color="#6B7280" />
                    <RNText style={styles.nicText}>{test.patientNIC}</RNText>
                  </View>
                  <View style={styles.doctorRow}>
                    <MaterialCommunityIcons name="doctor" size={14} color="#6B7280" />
                    <RNText style={styles.doctorName}>Dr. {test.doctorName}</RNText>
                  </View>
                </View>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(test.priority) }]}>
                <RNText style={styles.priorityText}>{test.priority.toUpperCase()}</RNText>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload(test)}
            >
              <MaterialCommunityIcons name="upload" size={20} color="#fff" />
              <RNText style={styles.uploadButtonText}>Upload Results</RNText>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {testsInProgress.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-all" size={64} color="#9CA3AF" />
            <RNText style={styles.emptyText}>No tests awaiting results</RNText>
            <RNText style={styles.emptySubtext}>All tests have been completed</RNText>
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Upload Test Results</RNText>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedTest && (
                <>
                  <View style={styles.testInfoCard}>
                    <RNText style={styles.infoTitle}>{selectedTest.testName}</RNText>
                    <RNText style={styles.infoText}>{selectedTest.patientName} • {selectedTest.patientNIC}</RNText>
                  </View>

                  <View style={styles.formGroup}>
                    <RNText style={styles.formLabel}>Test Results *</RNText>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      placeholder="Enter detailed test results..."
                      placeholderTextColor="#9CA3AF"
                      value={testResults}
                      onChangeText={setTestResults}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <RNText style={styles.formLabel}>Attach Files (Optional)</RNText>
                    <TouchableOpacity style={styles.attachButton}>
                      <MaterialCommunityIcons name="paperclip" size={20} color="#1E4BA3" />
                      <RNText style={styles.attachButtonText}>Attach PDF, Images, or Documents</RNText>
                    </TouchableOpacity>
                    {attachedFiles.length > 0 && (
                      <View style={styles.attachedFilesList}>
                        {attachedFiles.map((file, index) => (
                          <View key={index} style={styles.attachedFile}>
                            <MaterialCommunityIcons name="file-document" size={16} color="#1E4BA3" />
                            <RNText style={styles.attachedFileName}>{file}</RNText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <TouchableOpacity
                      style={styles.switchRow}
                      onPress={() => setIsAbnormal(!isAbnormal)}
                    >
                      <RNText style={styles.switchLabel}>Flag as Abnormal Result</RNText>
                      <Switch
                        value={isAbnormal}
                        onValueChange={setIsAbnormal}
                        trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                        thumbColor="#fff"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <RNText style={styles.formLabel}>Additional Notes</RNText>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      placeholder="Enter any additional observations..."
                      placeholderTextColor="#9CA3AF"
                      value={resultNotes}
                      onChangeText={setResultNotes}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {isAbnormal && (
                    <View style={styles.warningCard}>
                      <MaterialCommunityIcons name="alert" size={24} color="#F59E0B" />
                      <RNText style={styles.warningText}>
                        This result will be flagged as abnormal. Doctor and patient will be notified immediately.
                      </RNText>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.saveButton, isUploading && styles.saveButtonDisabled]} 
                onPress={saveResults}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                    <RNText style={styles.saveButtonText}>Upload & Notify</RNText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                <RNText style={styles.cancelButtonText}>Cancel</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  testsList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  testsContent: {
    padding: 16,
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  cardHeader: {
    height: 8,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  testIconWrapper: {
    position: 'absolute',
    right: 16,
    top: -20,
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  testInfo: {
    padding: 16,
    paddingTop: 20,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  testDetails: {
    flex: 1,
  },
  testName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  patientName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  nicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  nicText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E4BA3',
    paddingVertical: 16,
    margin: 16,
    marginTop: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#1E4BA3',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: 24,
    maxHeight: 500,
  },
  testInfoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1E4BA3',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E4BA3',
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E4BA3',
  },
  attachedFilesList: {
    marginTop: 12,
    gap: 8,
  },
  attachedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  attachedFileName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
    fontWeight: '600',
    lineHeight: 18,
  },
  modalActions: {
    padding: 24,
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E4BA3',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1E4BA3',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B7280',
  },
});

