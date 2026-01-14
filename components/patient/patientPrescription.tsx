// app/(auth)/prescription.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    ImageBackground,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
// @ts-ignore
import * as Print from "expo-print";
// @ts-ignore
import * as Sharing from "expo-sharing";

import { API_BASE_URL } from '../../src/config/constants';
import { storageService } from '../../src/services/storageService';

type Status = "Pending" | "Active" | "Expired" | "Completed";

type Prescription = {
  id: string | number;
  qrCode?: string;
  doctor: string;
  doctorContact?: string;
  patientName: string;
  issuedDate: string;
  pharmacy?: string;
  refillDate?: string | null;
  medicines: { name: string; dose?: string; frequency?: string }[];
  notes?: string;
  status: Status;
};

interface Props {
  onBack?: () => void;
  onMenu?: () => void;
}


// Fetch prescriptions from backend
const fetchPrescriptions = async (): Promise<Prescription[]> => {
  try {
    const user = await storageService.getUser();
    const patientId = user?.id != null ? String(user.id) : '';
    const url = patientId
      ? `${API_BASE_URL}/prescriptions?patientId=${encodeURIComponent(patientId)}`
      : `${API_BASE_URL}/prescriptions`;

    console.log('Fetching prescriptions from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Prescriptions response:', result);

    if (!result?.success || !Array.isArray(result.data)) {
      throw new Error(result?.message || 'Invalid response format');
    }

    const fmtDate = (v: any) => {
      if (!v) return '';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toISOString().split('T')[0];
    };

    const normalizeStatus = (v: any): Status => {
      const s = String(v || '').toLowerCase();
      if (s === 'pending') return 'Pending';
      if (s === 'completed') return 'Completed';
      if (s === 'expired') return 'Expired';
      if (s === 'active') return 'Active';
      return 'Active';
    };

    return result.data.map((row: any) => {
      const items = Array.isArray(row?.items) ? row.items : [];
      return {
        id: row?.id,
        qrCode: row?.qr_code != null && String(row.qr_code).trim() ? String(row.qr_code) : (row?.id != null ? `RX-${String(row.id)}` : undefined),
        doctor: row?.doctor_name ? `Dr. ${String(row.doctor_name).replace(/^Dr\.\s*/i, '')}` : 'Dr. Unknown',
        patientName:
          row?.patient_name ? String(row.patient_name) : (user?.fullName ? String(user.fullName) : 'Patient'),
        issuedDate: fmtDate(row?.prescription_date || row?.date_issued || row?.created_at),
        pharmacy: row?.pharmacy ? String(row.pharmacy) : undefined,
        refillDate: fmtDate(row?.expiry_date),
        medicines: items.map((it: any) => ({
          name: it?.medicine_name ? String(it.medicine_name) : String(it?.medicineName || 'Medicine'),
          dose: it?.dosage ? String(it.dosage) : (it?.dose ? String(it.dose) : undefined),
          frequency: it?.frequency ? String(it.frequency) : undefined,
        })),
        notes: row?.notes ? String(row.notes) : undefined,
        status: normalizeStatus(row?.status),
      } as Prescription;
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    throw error;
  }
};

const mockRequestRefill = (prescriptionId: number): Promise<{ success: boolean }> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.12) reject(new Error("Refill request failed (network)"));
      else resolve({ success: true });
    }, 800);
  });

export default function PrescriptionScreen({ onBack, onMenu }: Props) {
  // mark navigation as any to avoid strict route typing errors in this screen
  const navigation = useNavigation<any>();
  const [data, setData] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [doctorFilter, setDoctorFilter] = useState<string>("All Doctors");
  const [dateFilter, setDateFilter] = useState<string>("All Time");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrSelected, setQrSelected] = useState<Prescription | null>(null);
  const [refillLoadingId, setRefillLoadingId] = useState<string | number | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);

  const qrRef = useRef<any>(null);

  const animValsRef = useRef<Record<string | number, Animated.Value>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPrescriptions();
      setData(res);
      const m: Record<string | number, Animated.Value> = {};
      res.forEach((p) => (m[p.id as string | number] = new Animated.Value(0)));
      animValsRef.current = m;
      Animated.stagger(
        80,
        res.map((p) =>
          Animated.timing(animValsRef.current[p.id as string | number], {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          })
        )
      ).start();
    } catch (e: any) {
      setError(e.message || "Failed to load prescriptions");
      console.error('Load data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const uniqueDoctors = ["All Doctors", ...Array.from(new Set(data.map(p => p.doctor)))];
  const statusOptions = ["All Statuses", "Pending", "Active", "Expired", "Completed"];

  const filtered = data.filter((p) => {
    // Status filter
    if (statusFilter !== "All Statuses" && p.status !== statusFilter) return false;
    
    // Doctor filter
    if (doctorFilter !== "All Doctors" && p.doctor !== doctorFilter) return false;
    
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.doctor.toLowerCase().includes(q) &&
        !p.patientName.toLowerCase().includes(q) &&
        !p.medicines.some((m) => m.name.toLowerCase().includes(q)) &&
        !(p.notes?.toLowerCase().includes(q))
      ) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setStatusFilter("All Statuses");
    setDoctorFilter("All Doctors");
    setDateFilter("All Time");
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "All Statuses" || doctorFilter !== "All Doctors" || dateFilter !== "All Time" || search !== "";

  const openDetails = (pres: Prescription) => {
    setSelected(pres);
    setDetailModalVisible(true);
  };
  const closeDetails = () => {
    setDetailModalVisible(false);
    setSelected(null);
  };

  const getQrValue = (pres: Prescription | null) => {
    if (!pres) return '';
    const v = pres.qrCode != null ? String(pres.qrCode).trim() : '';
    return v || `RX-${String(pres.id)}`;
  };

  const openQr = (pres: Prescription) => {
    setQrSelected(pres);
    setQrModalVisible(true);
  };

  const closeQr = () => {
    setQrModalVisible(false);
    setQrSelected(null);
    qrRef.current = null;
  };

  const handleRequestRefill = async (pres: Prescription) => {
    setRefillLoadingId(pres.id);
    try {
      // Request refill functionality to be implemented
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert("Refill Requested", "Your refill request has been sent to the pharmacy.");
    } catch (e: any) {
      Alert.alert("Request Failed", e.message || "Unable to request refill.");
    } finally {
      setRefillLoadingId(null);
    }
  };

  const handleContactDoctor = (pres: Prescription) => {
    const contact = pres.doctorContact;
    if (!contact) {
      Alert.alert("No contact", "Doctor contact not provided.");
      return;
    }
    import("react-native").then(({ Linking }) => {
      Linking.openURL(contact).catch(() => {
        Alert.alert("Unable to open contact", contact);
      });
    });
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "Active":
        return "#2ECC71";
      case "Pending":
        return "#F8C851";
      case "Expired":
        return "#E74C3C";
      case "Completed":
        return "#4D9EF6";
      default:
        return "#999";
    }
  };

  const generatePrescriptionHTML = (pres: Prescription) => {
    const medsRows = pres.medicines
      .map(
        (m) =>
          `<tr>
            <td style="padding:8px;border:1px solid #ddd;">${m.name}</td>
            <td style="padding:8px;border:1px solid #ddd;">${m.dose ?? ""}</td>
            <td style="padding:8px;border:1px solid #ddd;">${m.frequency ?? ""}</td>
          </tr>`
      )
      .join("\n");

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 18px; color:#222; }
            h1 { color: #1E4BA3; }
            .meta { margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; margin-top:12px; }
            th { text-align:left; padding:8px; background:#f2f2f2; border:1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Prescription #${pres.id}</h1>
          <div class="meta">
            <div><strong>Doctor:</strong> ${pres.doctor}</div>
            <div><strong>Patient:</strong> ${pres.patientName}</div>
            <div><strong>Issued:</strong> ${pres.issuedDate}</div>
            <div><strong>Pharmacy:</strong> ${pres.pharmacy ?? "-"}</div>
            <div><strong>Status:</strong> ${pres.status}</div>
            <div><strong>Notes:</strong> ${pres.notes ?? "-"}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine</th><th>Dose</th><th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              ${medsRows}
            </tbody>
          </table>

          <div style="margin-top:18px;color:#777;font-size:12px;">
            Generated by MediVault
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async (pres: Prescription) => {
    try {
      const html = generatePrescriptionHTML(pres);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "ios" || (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Prescription-${pres.id}.pdf` });
      } else {
        Alert.alert("Saved", `PDF saved at ${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate PDF");
    }
  };

  const generateQrHTML = (opts: { title: string; code: string; dataUrl: string }) => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 18px; color:#222; }
            h1 { color: #1E4BA3; margin: 0 0 12px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
            .code { font-family: monospace; font-size: 14px; margin-top: 10px; color:#111; }
            .note { margin-top: 14px; color:#666; font-size: 12px; }
            img { display:block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <h1>${opts.title}</h1>
          <div class="box">
            <img width="240" height="240" src="${opts.dataUrl}" />
            <div class="code">${opts.code}</div>
          </div>
          <div class="note">Generated by MediVault</div>
        </body>
      </html>
    `;
  };

  const handleDownloadQR = async (pres: Prescription) => {
    const code = getQrValue(pres);
    try {
      const ref = qrRef.current;
      if (!ref || typeof ref.toDataURL !== 'function') {
        Alert.alert('QR not ready', 'Please open the QR preview and try again.');
        return;
      }

      const base64: string = await new Promise((resolve) => {
        ref.toDataURL((data: string) => resolve(data));
      });

      const dataUrl = `data:image/png;base64,${base64}`;
      const html = generateQrHTML({
        title: `Prescription QR Code`,
        code,
        dataUrl,
      });

      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'ios' || (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Prescription-QR-${pres.id}.pdf` });
      } else {
        Alert.alert('Saved', `QR PDF saved at ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to download QR');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              {onMenu ? (
                <TouchableOpacity onPress={onMenu} style={styles.backButton}>
                  <Ionicons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
              ) : onBack ? (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : null}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.headerTitle}>My Prescriptions</Text>
                <Text style={styles.headerSubtitle}>View all your prescriptions with complete details - read-only access</Text>
              </View>
            </View>
            <View style={styles.prescriptionCount}>
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.countText}>{data.length} Prescription{data.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="filter-variant" size={20} color="#333" />
            <Text style={styles.filtersTitle}>Filters</Text>
          </View>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#E74C3C" />
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            placeholder="Search doctor, medicine, notes..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status</Text>
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setStatusModalVisible(true)}>
              <Text style={styles.filterValue}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Doctor</Text>
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setDoctorModalVisible(true)}>
              <Text style={styles.filterValue}>{doctorFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <TouchableOpacity style={styles.filterDropdown}>
              <Text style={styles.filterValue}>{dateFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Prescriptions List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Prescriptions List</Text>
        
        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E4BA3" />
            <Text style={{ marginTop: 8 }}>Loading prescriptions...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "#E74C3C", fontWeight: "700" }}>Error</Text>
            <Text style={{ marginTop: 6 }}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-outline" size={48} color="#999" />
            <Text style={{ marginTop: 12, color: "#666" }}>No prescriptions found</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={{ flex: 1 }}
          >
            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ minWidth: 1200, paddingBottom: 100 }}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { width: 180 }]}>Doctor</Text>
                  <Text style={[styles.tableHeaderText, { width: 140 }]}>Specialty</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>Status</Text>
                  <Text style={[styles.tableHeaderText, { width: 150 }]}>Issued Date</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>Valid Until</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>Medicines</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>QR Code</Text>
                  <Text style={[styles.tableHeaderText, { width: 150 }]}>Actions</Text>
                </View>

                {/* Table Body */}
                {filtered.map((item) => {
                  const anim = animValsRef.current[item.id as string | number] ?? new Animated.Value(1);
                  const specialty = item.doctor.includes("Rohan") ? "Cardiology" : 
                                   item.doctor.includes("Kavitha") ? "Dermatology" :
                                   item.doctor.includes("Sunil") ? "General Medicine" :
                                   item.doctor.includes("Meera") ? "Pediatrics" : "Pediatrics";
                  
                  return (
                    <Animated.View key={item.id} style={{ opacity: anim }}>
                      <View style={styles.tableRow}>
                        <View style={[styles.tableCell, { width: 180 }]}>
                          <MaterialCommunityIcons name="doctor" size={20} color="#1E4BA3" />
                          <Text style={styles.tableCellText} numberOfLines={1}>{item.doctor.replace("Dr. ", "")}</Text>
                        </View>

                        <View style={[styles.tableCell, { width: 140 }]}>
                          <Text style={styles.tableCellText}>{specialty}</Text>
                        </View>

                        <View style={[styles.tableCell, { width: 120 }]}>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                          </View>
                        </View>

                        <View style={[styles.tableCell, { width: 150 }]}>
                          <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                          <View style={{ marginLeft: 6 }}>
                            <Text style={styles.tableCellText}>{item.issuedDate}</Text>
                            <Text style={styles.tableCellSubtext}>Issued</Text>
                          </View>
                        </View>

                        <View style={[styles.tableCell, { width: 120 }]}>
                          <Text style={styles.tableCellText}>{item.refillDate || "N/A"}</Text>
                        </View>

                        <View style={[styles.tableCell, { width: 120, justifyContent: 'center' }]}>
                          <View style={styles.medicinesBadge}>
                            <Text style={styles.medicinesText}>{item.medicines.length} items</Text>
                          </View>
                        </View>

                        <View style={[styles.tableCell, { width: 120, justifyContent: 'center', gap: 12 }]}>
                          <TouchableOpacity onPress={() => openQr(item)}>
                            <MaterialCommunityIcons name="eye-outline" size={22} color="#1E4BA3" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openQr(item)}>
                            <MaterialCommunityIcons name="download-outline" size={22} color="#666" />
                          </TouchableOpacity>
                        </View>

                        <View style={[styles.tableCell, { width: 150, gap: 8 }]}>
                          <TouchableOpacity style={styles.viewButton} onPress={() => openDetails(item)}>
                            <MaterialCommunityIcons name="eye" size={16} color="#1E4BA3" />
                            <Text style={styles.viewButtonText}>View</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDownloadPDF(item)}>
                            <MaterialCommunityIcons name="download" size={22} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>
          </ScrollView>
        )}
      </View>

      {/* Status Filter Modal */}
      <Modal visible={statusModalVisible} animationType="fade" transparent onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalScroll}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    statusFilter === status && styles.filterOptionActive
                  ]}
                  onPress={() => {
                    setStatusFilter(status);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === status && styles.filterOptionTextActive
                  ]}>{status}</Text>
                  {statusFilter === status && (
                    <Ionicons name="checkmark-circle" size={22} color="#1E4BA3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Doctor Filter Modal */}
      <Modal visible={doctorModalVisible} animationType="fade" transparent onRequestClose={() => setDoctorModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Doctor</Text>
              <TouchableOpacity onPress={() => setDoctorModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalScroll}>
              {uniqueDoctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor}
                  style={[
                    styles.filterOption,
                    doctorFilter === doctor && styles.filterOptionActive
                  ]}
                  onPress={() => {
                    setDoctorFilter(doctor);
                    setDoctorModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    doctorFilter === doctor && styles.filterOptionTextActive
                  ]}>{doctor}</Text>
                  {doctorFilter === doctor && (
                    <Ionicons name="checkmark-circle" size={22} color="#1E4BA3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" onRequestClose={closeDetails} transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {selected ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700" }}>Prescription #{selected.id}</Text>
                  <TouchableOpacity onPress={closeDetails}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailLabel}>Doctor</Text>
                <Text style={styles.detailValue}>{selected.doctor}</Text>

                <Text style={styles.detailLabel}>Issued</Text>
                <Text style={styles.detailValue}>{selected.issuedDate}</Text>

                <Text style={styles.detailLabel}>Pharmacy</Text>
                <Text style={styles.detailValue}>{selected.pharmacy ?? "-"}</Text>

                <Text style={styles.detailLabel}>Medicines</Text>
                {selected.medicines.map((m, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: "600" }}>{m.name}</Text>
                    <Text style={{ color: "#555" }}>{m.dose ?? ""} • {m.frequency ?? ""}</Text>
                  </View>
                ))}

                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selected.notes ?? "-"}</Text>

                <Text style={styles.detailLabel}>QR Code</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={1}>{getQrValue(selected)}</Text>
                  <TouchableOpacity style={[styles.qrMiniBtn]} onPress={() => openQr(selected)}>
                    <MaterialCommunityIcons name="qrcode" size={18} color="#1E4BA3" />
                    <Text style={styles.qrMiniBtnText}>View</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                  <TouchableOpacity style={[styles.modalBtn]} onPress={() => { handleDownloadPDF(selected); }}>
                    <MaterialCommunityIcons name="download" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#F39C12" }]} onPress={() => { handleRequestRefill(selected); }}>
                    <MaterialCommunityIcons name="autorenew" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Request Refill</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* QR Modal */}
      <Modal visible={qrModalVisible} animationType="fade" onRequestClose={closeQr} transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {qrSelected ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700' }}>Prescription QR</Text>
                  <TouchableOpacity onPress={closeQr}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <View style={styles.qrBox}>
                    <QRCode
                      value={getQrValue(qrSelected)}
                      size={220}
                      backgroundColor="white"
                      color="black"
                      getRef={(c: any) => (qrRef.current = c)}
                    />
                  </View>
                  <Text style={styles.qrCodeText} numberOfLines={1}>{getQrValue(qrSelected)}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity style={[styles.modalBtn]} onPress={() => handleDownloadQR(qrSelected)}>
                    <MaterialCommunityIcons name="download" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Download QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6B7280' }]} onPress={closeQr}>
                    <MaterialCommunityIcons name="close" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  background: { flex: 1, width: '100%', height: '100%' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(243, 244, 246, 0.96)' },
  root: { flex: 1, backgroundColor: "transparent", paddingTop: 0 },
  header: {
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  headerSubtitle: { fontSize: 11, color: "rgba(255, 255, 255, 0.9)", marginTop: 2, maxWidth: "85%", lineHeight: 16 },
  prescriptionCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  countText: { fontSize: 11, fontWeight: "600", color: "#fff" },

  filtersContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filtersTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEE",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCC",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E74C3C",
  },
  
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterItem: {
    flex: 1,
    minWidth: 100,
  },
  filterLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterValue: {
    fontSize: 11,
    color: "#333",
    flexShrink: 1,
  },

  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    minHeight: 80,
    backgroundColor: "#fff",
  },
  tableCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  tableCellText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
    flexShrink: 1,
  },
  tableCellSubtext: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    minWidth: 90,
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  medicinesBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  medicinesText: {
    fontSize: 12,
    color: "#1E4BA3",
    fontWeight: "600",
  },

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1E4BA3",
    backgroundColor: "#F0F9FF",
  },
  viewButtonText: {
    fontSize: 12,
    color: "#1E4BA3",
    fontWeight: "600",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  filterModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxHeight: "60%",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  filterModalScroll: {
    maxHeight: 400,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  filterOptionActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#1E4BA3",
  },
  filterOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: "#1E4BA3",
    fontWeight: "600",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  modalBtn: {
    flex: 1,
    backgroundColor: "#1E4BA3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  qrMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E4BA3',
    backgroundColor: '#F0F9FF',
  },
  qrMiniBtnText: {
    fontSize: 12,
    color: '#1E4BA3',
    fontWeight: '600',
  },
  qrBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrCodeText: {
    marginTop: 10,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
});