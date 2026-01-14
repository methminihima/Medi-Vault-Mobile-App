// app/(auth)/find-doctor.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  yearsOfExperience: number;
  email: string;
  phone?: string;
  availableLocations?: string[];
};

type Props = {
  onBack?: () => void;
  onMenu?: () => void;
};

export default function FindDoctorScreen({ onBack, onMenu }: Props) {
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All Specializations");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [specializationModalVisible, setSpecializationModalVisible] = useState(false);

  const cities = ["All Cities", "Colombo", "Kandy", "Galle", "Jaffna", "Negombo"];
  const specializations = [
    "All Specializations",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "General Medicine",
  ];

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, selectedCity, selectedSpecialization]);

  const loadDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/doctors");
      const json = await response.json();

      if (json.ok && json.data) {
        const formattedDoctors = json.data.map((doc: any) => ({
          id: doc.id,
          name: `Dr. ${doc.first_name} ${doc.last_name}`,
          specialization: doc.specialization || "General Medicine",
          yearsOfExperience: doc.years_of_experience || 0,
          email: doc.email || "",
          phone: doc.phone,
          availableLocations: ["Main Hospital", "City Clinic"],
        }));
        setDoctors(formattedDoctors);
      } else {
        setError(json.error || "Failed to load doctors");
      }
    } catch (err) {
      console.error("Error loading doctors:", err);
      setError("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.specialization.toLowerCase().includes(query)
      );
    }

    // Specialization filter
    if (selectedSpecialization !== "All Specializations") {
      filtered = filtered.filter((doc) => doc.specialization === selectedSpecialization);
    }

    // City filter would be applied if we had location data
    // For now, we'll keep all doctors when "All Cities" is selected

    setFilteredDoctors(filtered);
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <View style={styles.doctorCard}>
      <Text style={styles.doctorName}>{item.name}</Text>
      <Text style={styles.doctorSpecialization}>{item.specialization}</Text>

      <View style={styles.doctorInfo}>
        <Ionicons name="star" size={16} color="#F59E0B" />
        <Text style={styles.infoText}>{item.yearsOfExperience} years experience</Text>
      </View>

      <View style={styles.doctorInfo}>
        <MaterialCommunityIcons name="email-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>{item.email}</Text>
      </View>

      {item.phone && (
        <View style={styles.doctorInfo}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      )}

      <View style={styles.availableSection}>
        <Text style={styles.availableLabel}>Available At:</Text>
        {item.availableLocations?.map((location, index) => (
          <View key={index} style={styles.locationBadge}>
            <Ionicons name="location-outline" size={14} color="#3B82F6" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push("/(tabs)/patient-dashboard" as any)}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );

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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                {onMenu ? (
                  <TouchableOpacity onPress={onMenu} style={styles.backButton}>
                    <Ionicons name="menu" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : onBack ? (
                  <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : null}
                <View style={styles.headerIconCircle}>
                  <Ionicons name="search" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.headerTitle}>Find Doctors</Text>
                  <Text style={styles.headerSubtitle}>
                    Search for available doctors by location, specialization, and schedule
                  </Text>
                </View>
              </View>
            </View>

        {/* Search & Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Search & Filter</Text>
          <Text style={styles.filterSubtitle}>Find doctors based on your preferences and location</Text>

          <View style={styles.filterGrid}>
            {/* Search Input */}
            <View style={styles.filterColumn}>
              <Text style={styles.filterLabel}>Search</Text>
              <View style={styles.searchInput}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInputField}
                  placeholder="Doctor name, specialization..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* City Dropdown */}
            <View style={styles.filterColumn}>
              <Text style={styles.filterLabel}>City</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setCityModalVisible(true)}
              >
                <Text style={styles.dropdownText}>{selectedCity}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Specialization Dropdown */}
            <View style={styles.filterColumn}>
              <Text style={styles.filterLabel}>Specialization</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setSpecializationModalVisible(true)}
              >
                <Text style={styles.dropdownText}>{selectedSpecialization}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <View style={styles.resultsLeft}>
            <Text style={styles.resultsTitle}>{filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Found</Text>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{filteredDoctors.length} results</Text>
            </View>
          </View>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === "list" && styles.viewButtonActive]}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === "list" ? "#1F2937" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "list" && styles.viewButtonTextActive,
                ]}
              >
                List View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewButton, viewMode === "map" && styles.viewButtonActive]}
              onPress={() => setViewMode("map")}
            >
              <Ionicons
                name="map"
                size={18}
                color={viewMode === "map" ? "#1F2937" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "map" && styles.viewButtonTextActive,
                ]}
              >
                Map View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor List */}
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No doctors found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search filters</Text>
            </View>
          ) : (
            <FlatList
              data={filteredDoctors}
              renderItem={renderDoctorCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </ScrollView>

          {/* City Modal */}
          <Modal
            visible={cityModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCityModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCityModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select City</Text>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedCity(city);
                      setCityModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{city}</Text>
                    {selectedCity === city && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Specialization Modal */}
          <Modal
            visible={specializationModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSpecializationModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSpecializationModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Specialization</Text>
                {specializations.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedSpecialization(spec);
                      setSpecializationModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{spec}</Text>
                    {selectedSpecialization === spec && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(243, 244, 246, 0.96)',
  },
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  filterSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  filterSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  filterGrid: {
    flexDirection: "row",
    gap: 12,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownText: {
    fontSize: 14,
    color: "#1F2937",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  resultsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  resultsBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  viewButtonTextActive: {
    color: "#1F2937",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  doctorCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
  },
  availableSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  availableLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
    gap: 6,
    alignSelf: "flex-start",
  },
  locationText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "500",
  },
  bookButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionText: {
    fontSize: 15,
    color: "#374151",
  },
});