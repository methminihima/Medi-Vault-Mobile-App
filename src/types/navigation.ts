import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Auth Stack
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  BiometricSetup: undefined;
  Onboarding: undefined;
};

/**
 * Dashboard Stacks by Role
 */
export type PatientDashboardStackParamList = {
  PatientDashboard: undefined;
  PatientProfile: undefined;
};

export type DoctorDashboardStackParamList = {
  DoctorDashboard: undefined;
  DoctorProfile: undefined;
  DoctorSchedule: undefined;
};

export type PharmacistDashboardStackParamList = {
  PharmacistDashboard: undefined;
  PharmacistProfile: undefined;
};

export type LabTechnicianDashboardStackParamList = {
  LabTechnicianDashboard: undefined;
  LabTechnicianProfile: undefined;
};

export type AdminDashboardStackParamList = {
  AdminDashboard: undefined;
  AdminProfile: undefined;
};

/**
 * Appointment Stack
 */
export type AppointmentStackParamList = {
  AppointmentList: undefined;
  AppointmentDetail: { id: number };
  AppointmentBooking: { doctorId?: number };
  AppointmentCalendar: undefined;
  DoctorSearch: undefined;
  DoctorProfile: { id: number };
};

/**
 * Medical Records Stack
 */
export type MedicalRecordsStackParamList = {
  MedicalRecordList: undefined;
  MedicalRecordDetail: { id: number };
  MedicalRecordCreate: { patientId: number; appointmentId?: number };
  VitalSigns: { recordId: number };
};

/**
 * Prescriptions Stack
 */
export type PrescriptionsStackParamList = {
  PrescriptionList: undefined;
  PrescriptionDetail: { id: number };
  PrescriptionCreate: { patientId: number; medicalRecordId?: number };
  PrescriptionQRDisplay: { id: number };
  PrescriptionQRScan: undefined;
  PrescriptionVerify: { qrCode: string };
};

/**
 * Medicines Stack
 */
export type MedicinesStackParamList = {
  MedicineList: undefined;
  MedicineDetail: { id: number };
  MedicineCreate: undefined;
  MedicineEdit: { id: number };
  MedicineInventory: undefined;
  LowStockAlert: undefined;
};

/**
 * Lab Tests Stack
 */
export type LabTestsStackParamList = {
  LabTestList: undefined;
  LabTestDetail: { id: number };
  LabTestOrder: { patientId: number };
  LabTestResults: { id: number };
  LabTestUpload: { id: number };
};

/**
 * Bills & Payments Stack
 */
export type BillsStackParamList = {
  BillList: undefined;
  BillDetail: { id: number };
  BillCreate: { patientId: number };
  PaymentCreate: { billId: number };
  PaymentHistory: undefined;
};

/**
 * Messages Stack
 */
export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: number; recipientId: number; recipientName: string };
  MessageSearch: undefined;
};

/**
 * Patients Stack
 */
export type PatientsStackParamList = {
  PatientList: undefined;
  PatientDetail: { id: number };
  PatientCreate: undefined;
  PatientEdit: { id: number };
  PatientMedicalHistory: { id: number };
};

/**
 * Profile Stack
 */
export type ProfileStackParamList = {
  ProfileView: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  About: undefined;
  Help: undefined;
};

/**
 * Notifications Stack
 */
export type NotificationsStackParamList = {
  NotificationList: undefined;
  NotificationDetail: { id: number };
};

/**
 * Main Tab Navigator
 */
export type MainTabParamList = {
  DashboardStack: NavigatorScreenParams<
    PatientDashboardStackParamList | DoctorDashboardStackParamList
  >;
  AppointmentsStack: NavigatorScreenParams<AppointmentStackParamList>;
  MedicalRecordsStack?: NavigatorScreenParams<MedicalRecordsStackParamList>;
  PrescriptionsStack?: NavigatorScreenParams<PrescriptionsStackParamList>;
  MedicinesStack?: NavigatorScreenParams<MedicinesStackParamList>;
  LabTestsStack?: NavigatorScreenParams<LabTestsStackParamList>;
  BillsStack?: NavigatorScreenParams<BillsStackParamList>;
  PatientsStack?: NavigatorScreenParams<PatientsStackParamList>;
  MessagesStack: NavigatorScreenParams<MessagesStackParamList>;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

/**
 * Root Stack Navigator
 */
export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: { screen: string; params?: any };
};
