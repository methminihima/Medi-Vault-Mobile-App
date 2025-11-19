/**
 * User Model
 */
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'lab_technician' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profilePicture?: string;
}

/**
 * Patient Model
 */
export interface Patient {
  id: number;
  userId: number;
  user?: User;
  nic: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceInfo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Doctor Model
 */
export interface Doctor {
  id: number;
  userId: number;
  user?: User;
  specialization: string;
  licenseNumber: string;
  qualifications: string;
  experience?: number;
  consultationFee?: number;
  availableDays?: string[];
  availableTimeSlots?: string[];
  rating?: number;
  totalRatings?: number;
  biography?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pharmacist Model
 */
export interface Pharmacist {
  id: number;
  userId: number;
  user?: User;
  pharmacyLicense: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lab Technician Model
 */
export interface LabTechnician {
  id: number;
  userId: number;
  user?: User;
  labLicense: string;
  labName?: string;
  labAddress?: string;
  specialization?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Appointment Model
 */
export interface Appointment {
  id: number;
  patientId: number;
  patient?: Patient;
  doctorId: number;
  doctor?: Doctor;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  reason?: string;
  notes?: string;
}

/**
 * Medical Record Model
 */
export interface MedicalRecord {
  id: number;
  patientId: number;
  patient?: Patient;
  doctorId: number;
  doctor?: Doctor;
  appointmentId?: number;
  appointment?: Appointment;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDto {
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  vitalSigns?: any;
}

export interface UpdateMedicalRecordDto {
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
  vitalSigns?: any;
}

/**
 * Prescription Model
 */
export interface Prescription {
  id: number;
  patientId: number;
  patient?: Patient;
  doctorId: number;
  doctor?: Doctor;
  medicalRecordId?: number;
  medicalRecord?: MedicalRecord;
  prescriptionDate: string;
  expiryDate: string;
  status: 'active' | 'dispensed' | 'expired' | 'cancelled';
  instructions?: string;
  qrCode?: string;
  dispensedBy?: number;
  dispensedAt?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  medicineId: number;
  medicine?: Medicine;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface CreatePrescriptionDto {
  patientId: number;
  doctorId: number;
  medicalRecordId?: number;
  prescriptionDate: string;
  expiryDate: string;
  instructions?: string;
  items: {
    medicineId: number;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }[];
}

export interface UpdatePrescriptionDto {
  expiryDate?: string;
  status?: string;
  instructions?: string;
}

/**
 * Medicine Model
 */
export interface Medicine {
  id: number;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category: string;
  description?: string;
  dosageForm: string;
  strength?: string;
  unitPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  batchNumber?: string;
  requiresPrescription: boolean;
  sideEffects?: string;
  contraindications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineDto {
  name: string;
  genericName?: string;
  manufacturer?: string;
  category: string;
  description?: string;
  dosageForm: string;
  strength?: string;
  unitPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: string;
  batchNumber?: string;
  requiresPrescription: boolean;
  sideEffects?: string;
  contraindications?: string;
}

export interface UpdateMedicineDto extends Partial<CreateMedicineDto> {}

/**
 * Lab Test Model
 */
export interface LabTest {
  id: number;
  patientId: number;
  patient?: Patient;
  doctorId?: number;
  doctor?: Doctor;
  testType: string;
  testName: string;
  description?: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled';
  orderDate: string;
  sampleCollectionDate?: string;
  resultDate?: string;
  results?: any;
  resultFiles?: string[];
  technicianId?: number;
  technician?: LabTechnician;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabTestDto {
  patientId: number;
  doctorId?: number;
  testType: string;
  testName: string;
  description?: string;
  orderDate: string;
  notes?: string;
}

export interface UpdateLabTestDto {
  status?: string;
  sampleCollectionDate?: string;
  resultDate?: string;
  results?: any;
  notes?: string;
}

/**
 * Bill Model
 */
export interface Bill {
  id: number;
  patientId: number;
  patient?: Patient;
  billDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  items: BillItem[];
  payments?: Payment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: number;
  billId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'consultation' | 'medication' | 'lab_test' | 'procedure' | 'other';
  referenceId?: number;
}

export interface CreateBillDto {
  patientId: number;
  billDate: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    itemType: string;
    referenceId?: number;
  }[];
  notes?: string;
}

export interface UpdateBillDto {
  dueDate?: string;
  status?: string;
  notes?: string;
}

/**
 * Payment Model
 */
export interface Payment {
  id: number;
  billId: number;
  bill?: Bill;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'insurance';
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  billId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

/**
 * Notification Model
 */
export interface Notification {
  id: number;
  userId: number;
  user?: User;
  type: 'appointment' | 'prescription' | 'lab_test' | 'bill' | 'message' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Chat Message Model
 */
export interface ChatMessage {
  id: number;
  senderId: number;
  sender?: User;
  recipientId: number;
  recipient?: User;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit Log Model
 */
export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  entity: string;
  entityId: number;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
