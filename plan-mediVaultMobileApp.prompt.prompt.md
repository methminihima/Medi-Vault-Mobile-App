# MediVault Application - Comprehensive Architecture Research Report

## Executive Summary

MediVault is a full-stack healthcare management system built for Sri Lanka, featuring electronic health records (EHR), role-based access control, QR-coded prescriptions, and secure nationwide patient data management. The application serves 5 user roles: Patients, Doctors, Pharmacists, Lab Technicians, and Administrators.

---

## 1. CORE FEATURES & FUNCTIONALITY

### 1.1 Pages & Modules

| Page/Module | Route | Features | User Roles |
|-------------|-------|----------|------------|
| **Landing Page** | `/` | Marketing page, hero section, feature showcase, statistics | Public |
| **Login** | `/login` | Username/password authentication, session-based auth | Public |
| **Dashboard** | `/dashboard` | Role-specific dashboards with stats, quick actions | All authenticated |
| **Appointments** |  | Book, view, manage appointments; calendar integration | All users |
| **Medical Records** |  | View complete medical history, diagnoses, vital signs | Patient, Doctor, Admin |
| **Prescriptions** |  | View prescriptions, QR codes, download PDFs | Patient, Doctor, Pharmacist, Admin |
| **Messages** |  | Real-time chat, WebSocket-based messaging | All authenticated |
| **Notifications** |  | System notifications, alerts, reminders | All authenticated |

### 1.2 Feature Breakdown by Role

#### Patients
- Book and manage appointments with doctors
- Access complete medical history
- View and download prescriptions with QR codes
- Access lab test results
- View bills and payment history
- Receive real-time notifications
- Secure messaging with healthcare providers

#### Doctors
- View and manage patient appointments
- Create medical records with diagnoses and vital signs
- Issue prescriptions with QR code generation
- Order lab tests
- View patient dashboard with complete health data
- Search patients by NIC, Health ID, or name
- Real-time messaging with patients

#### Pharmacists
- Scan and verify prescription QR codes
- Manage medicine inventory
- Track stock levels with low-stock alerts
- Update medicine stock
- View dispensing history
- Receive automated reorder notifications

#### Lab Technicians
- View assigned lab tests
- Upload test results
- Flag abnormal results
- Notify doctors and patients when results are ready
- Manage test history

#### Administrators
- Create and manage all user accounts
- Generate system reports
- View audit logs
- Manage role-based permissions
- Monitor system data
- System-wide analytics dashboard

---

## 2. AUTHENTICATION & AUTHORIZATION

### 2.1 Authentication System

**Technology Stack:**
- **Passport.js** with Local Strategy
- **bcrypt** for password hashing (10 salt rounds)
- **express-session** for session management
- **connect-pg-simple** for PostgreSQL session storage

**Session Configuration:**
```typescript
- TTL: 7 days (604,800,000 ms)
- Storage: PostgreSQL 'sessions' table
- Cookie: HttpOnly, Secure in production
- Credentials: Include for CORS
```

**Auth Endpoints:**
- `POST /api/login` - Username/password login
- `POST /api/register` - User registration
- `POST /api/logout` - Session termination
- `GET /api/auth/user` - Get current user

**Frontend Auth Hook:**
```typescript
useAuth() // Returns: { user, isLoading, isAuthenticated }
```

### 2.2 Authorization System

**Role-Based Middleware Functions:**
```typescript
isAuthenticated        // Any logged-in user
isAdmin               // Admin only
isDoctor              // Doctor only
isPatient             // Patient only
isPharmacist          // Pharmacist only
isLabTechnician       // Lab Technician only
isDoctorOrAdmin       // Doctor OR Admin
isPharmacistOrAdmin   // Pharmacist OR Admin
isLabTechOrAdmin      // Lab Technician OR Admin
hasRole(...roles)     // Custom role check
```

**Authorization Matrix:**

| Action | Patient | Doctor | Pharmacist | Lab Tech | Admin |
|--------|---------|--------|------------|----------|-------|
| Create medical records | ❌ | ✅ | ❌ | ❌ | ✅ |
| Issue prescriptions | ❌ | ✅ | ❌ | ❌ | ✅ |
| Add/update medicines | ❌ | ❌ | ✅ | ❌ | ✅ |
| Order lab tests | ❌ | ✅ | ❌ | ❌ | ✅ |
| Update test results | ❌ | ❌ | ❌ | ✅ | ✅ |
| View own appointments | ✅ | ✅ | ✅ | ✅ | ✅ |

**WebSocket Security:**
- Session-based authentication required
- Connection rejected if not authenticated (code 1008)
- User ID tracked with each connection
- Messages tagged with sender ID and timestamp

---

## 3. BACKEND API STRUCTURE

### 3.1 Complete API Endpoints

#### User & Auth Routes
```
POST   /api/login                    // Login
POST   /api/register                 // Register new user
POST   /api/logout                   // Logout
GET    /api/auth/user                // Get current user
```

#### Patient Routes
```
POST   /api/patients                 // Create patient profile
GET    /api/patients                 // Get all patients
GET    /api/patients/:id             // Get patient by ID
GET    /api/patients/nic/:nic        // Get patient by NIC
```

#### Doctor Routes
```
POST   /api/doctors                  // Create doctor profile
GET    /api/doctors                  // Get all doctors
GET    /api/doctors/:id              // Get doctor by ID
```

#### Appointment Routes
```
POST   /api/appointments             // Create appointment
GET    /api/appointments             // Get user's appointments
PATCH  /api/appointments/:id/status  // Update appointment status
```

#### Medical Record Routes
```
POST   /api/medical-records                  // Create record (Doctor/Admin)
GET    /api/medical-records                  // Get user's records
GET    /api/medical-records/patient/:patientId  // Get patient records
```

#### Prescription Routes
```
POST   /api/prescriptions            // Issue prescription (Doctor/Admin)
GET    /api/prescriptions            // Get user's prescriptions
```

#### Medicine Routes
```
POST   /api/medicines                // Add medicine (Pharmacist/Admin)
GET    /api/medicines                // Get all medicines
PATCH  /api/medicines/:id/stock      // Update stock (Pharmacist/Admin)
```

#### Lab Test Routes
```
POST   /api/lab-tests                // Order lab test (Doctor/Admin)
GET    /api/lab-tests                // Get user's lab tests
PATCH  /api/lab-tests/:id            // Update test results (Lab Tech/Admin)
```

#### Billing & Payment Routes
```
POST   /api/bills                    // Create bill
GET    /api/bills                    // Get user's bills
POST   /api/payments                 // Create payment
```

#### Notification Routes
```
GET    /api/notifications            // Get user notifications
PATCH  /api/notifications/:id/read   // Mark as read
```

#### Chat/Message Routes
```
GET    /api/messages/:userId         // Get messages with user
POST   /api/messages                 // Send message
WS     /ws                           // WebSocket connection
```

### 3.2 API Response Patterns

**Success Response:**
```json
{
  "id": "uuid",
  "field1": "value",
  ...
}
```

**Error Response:**
```json
{
  "message": "Error description"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## 4. DATABASE SCHEMA

### 4.1 Core Tables

#### Authentication Tables

**sessions**
```typescript
sid: varchar (PK)
sess: jsonb
expire: timestamp
```

**users**
```typescript
id: varchar (PK, UUID)
username: varchar (unique, required)
email: varchar (unique)
password: varchar (hashed)
firstName: varchar
lastName: varchar
profileImageUrl: varchar
role: varchar (patient|doctor|pharmacist|lab_technician|admin)
createdAt: timestamp
updatedAt: timestamp
```

#### Role-Specific Tables

**patients**
```typescript
id: varchar (PK)
userId: varchar (FK → users.id)
nic: varchar (unique, required)     // National Identity Card
healthId: varchar (unique)           // Health ID
rfid: varchar (unique)               // RFID for identification
dateOfBirth: timestamp
gender: varchar
contactInfo: varchar
address: text
bloodType: varchar
allergies: text
createdAt, updatedAt: timestamp
```

**doctors**
```typescript
id: varchar (PK)
userId: varchar (FK → users.id)
specialization: varchar
licenseNumber: varchar (unique)
qualifications: text
experience: integer                  // years
consultationFee: decimal(10,2)
availableDays: text                  // JSON
createdAt, updatedAt: timestamp
```

**pharmacists**
```typescript
id: varchar (PK)
userId: varchar (FK → users.id)
licenseNumber: varchar (unique)
createdAt, updatedAt: timestamp
```

**lab_technicians**
```typescript
id: varchar (PK)
userId: varchar (FK → users.id)
specialization: varchar
licenseNumber: varchar (unique)
createdAt, updatedAt: timestamp
```

#### Clinical Tables

**appointments**
```typescript
id: varchar (PK)
patientId: varchar (FK → patients.id)
doctorId: varchar (FK → doctors.id)
appointmentDate: timestamp
status: varchar (pending|confirmed|completed|cancelled)
reason: text
notes: text
createdAt, updatedAt: timestamp
```

**medical_records**
```typescript
id: varchar (PK)
patientId: varchar (FK → patients.id)
doctorId: varchar (FK → doctors.id)
appointmentId: varchar (FK → appointments.id)
diagnosis: text
symptoms: text
notes: text
vitalSigns: text                     // JSON string
createdAt, updatedAt: timestamp
```

**prescriptions**
```typescript
id: varchar (PK)
patientId: varchar (FK → patients.id)
doctorId: varchar (FK → doctors.id)
medicalRecordId: varchar (FK → medical_records.id)
dateIssued: timestamp
expiryDate: timestamp
qrCode: text                         // QR code data
status: varchar (active|dispensed|expired)
notes: text
createdAt, updatedAt: timestamp
```

**prescription_items**
```typescript
id: varchar (PK)
prescriptionId: varchar (FK → prescriptions.id)
medicineId: varchar (FK → medicines.id)
dosage: varchar
frequency: varchar
duration: varchar
quantity: integer
instructions: text
createdAt: timestamp
```

**medicines**
```typescript
id: varchar (PK)
name: varchar
genericName: varchar
manufacturer: varchar
category: varchar
description: text
dosageForm: varchar (tablet|capsule|syrup|injection)
strength: varchar
unitPrice: decimal(10,2)
stockQuantity: integer (default: 0)
reorderLevel: integer (default: 10)
expiryDate: timestamp
batchNumber: varchar
createdAt, updatedAt: timestamp
```

**lab_tests**
```typescript
id: varchar (PK)
patientId: varchar (FK → patients.id)
doctorId: varchar (FK → doctors.id)
labTechnicianId: varchar (FK → lab_technicians.id)
testType: varchar
testName: varchar
status: varchar (pending|in_progress|completed|cancelled)
requestDate: timestamp
completionDate: timestamp
results: text
resultFileUrl: varchar
isAbnormal: boolean (default: false)
notes: text
createdAt, updatedAt: timestamp
```

#### Financial Tables

**bills**
```typescript
id: varchar (PK)
patientId: varchar (FK → patients.id)
appointmentId: varchar (FK → appointments.id)
totalAmount: decimal(10,2)
discount: decimal(10,2)
finalAmount: decimal(10,2)
status: varchar (pending|paid|cancelled)
billDate: timestamp
dueDate: timestamp
notes: text
createdAt, updatedAt: timestamp
```

**bill_items**
```typescript
id: varchar (PK)
billId: varchar (FK → bills.id)
itemType: varchar (consultation|medicine|lab_test|procedure)
itemId: varchar
description: text
quantity: integer
unitPrice: decimal(10,2)
amount: decimal(10,2)
createdAt: timestamp
```

**payments**
```typescript
id: varchar (PK)
billId: varchar (FK → bills.id)
amount: decimal(10,2)
paymentMethod: varchar (cash|card|insurance|online)
transactionId: varchar
paymentDate: timestamp
status: varchar (completed|pending|failed)
notes: text
createdAt: timestamp
```

#### Communication Tables

**notifications**
```typescript
id: varchar (PK)
recipientId: varchar (FK → users.id)
type: varchar (appointment|prescription|lab_result|low_stock|system)
title: varchar
message: text
relatedEntityId: varchar
isRead: boolean (default: false)
createdAt: timestamp
```

**chat_messages**
```typescript
id: varchar (PK)
senderId: varchar (FK → users.id)
receiverId: varchar (FK → users.id)
message: text
isRead: boolean (default: false)
createdAt: timestamp
```

#### Audit Table

**audit_logs**
```typescript
id: varchar (PK)
userId: varchar (FK → users.id)
action: varchar
entityType: varchar
entityId: varchar
details: text
ipAddress: varchar
createdAt: timestamp
```

### 4.2 Key Relationships

- Users → Patients/Doctors/Pharmacists/Lab Technicians (1:1)
- Patients → Appointments (1:N)
- Doctors → Appointments (1:N)
- Appointments → Medical Records (1:N)
- Prescriptions → Prescription Items (1:N)
- Prescriptions → Medicines (N:M via prescription_items)
- Bills → Bill Items (1:N)
- Bills → Payments (1:N)

---

## 5. STATE MANAGEMENT

### 5.1 Data Fetching Strategy

**Technology:** TanStack Query (React Query v5)

**Configuration:**
```typescript
{
  queries: {
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false
  },
  mutations: {
    retry: false
  }
}
```

**Query Patterns:**
```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ["/api/endpoint"],
  queryFn: () => fetch("/api/endpoint").then(res => res.json())
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/endpoint", data),
  onSuccess: () => queryClient.invalidateQueries(["/api/endpoint"])
});
```

### 5.2 API Client

**File:** `client/src/lib/api.ts`

**Available Methods:**
```typescript
api.get<T>(url: string)
api.post<T>(url: string, data?: any)
api.patch<T>(url: string, data?: any)
api.delete<T>(url: string)
api.put<T>(url: string, data?: any)
```

**Error Handling:**
```typescript
interface ApiError {
  message: string;
  status?: number;
}
```

### 5.3 Global State

- **Authentication:** Managed via `useAuth()` hook with React Query
- **Theme:** Context Provider (`ThemeProvider`)
- **Toast Notifications:** Custom hook (`useToast`)
- **No Redux/Zustand:** Server state managed by React Query

---

## 6. KEY UI COMPONENTS

### 6.1 Component Library

**Foundation:** shadcn/ui (Radix UI + Tailwind CSS)

**Core Components:**
```
- accordion        - alert-dialog      - alert
- aspect-ratio     - avatar            - badge
- breadcrumb       - button            - calendar
- card             - carousel          - chart
- checkbox         - collapsible       - command
- context-menu     - dialog            - drawer
- dropdown-menu    - form              - hover-card
- input            - input-otp         - label
- menubar          - navigation-menu   - pagination
- popover          - progress          - radio-group
- resizable        - scroll-area       - select
- separator        - sheet             - sidebar
- skeleton         - slider            - switch
- table            - tabs              - textarea
- toast            - toaster           - toggle
- toggle-group     - tooltip
```

### 6.2 Custom Components

**app-sidebar.tsx**
- Navigation sidebar with role-based menu items
- Logout functionality
- User profile section
- Collapsible design

**loading-screen.tsx**
- Full-screen loading animation
- Used during authentication check

**theme-provider.tsx**
- Light/Dark theme support
- Theme persistence
- System preference detection

**theme-toggle.tsx**
- Theme switcher button
- Icon-based toggle

### 6.3 Mobile-Critical Components

| Component | Mobile Equivalent | Notes |
|-----------|-------------------|-------|
| Sidebar | Bottom Navigation / Drawer | Convert to mobile-friendly nav |
| Data Tables | Cards/Lists | Responsive card layout |
| Dialogs | Bottom Sheets | Native mobile feel |
| Dropdown Menus | Action Sheets | iOS/Android patterns |
| Date Picker | Native Date Picker | Platform-specific |
| Calendar | React Native Calendar | Library needed |
| Charts | React Native Charts | Library (recharts equivalent) |

---

## 7. BUSINESS LOGIC

### 7.1 Key Utilities

**File:** `client/src/lib/authUtils.ts`
```typescript
isUnauthorizedError(error): boolean
// Check if error is 401 Unauthorized
```

**File:** `client/src/lib/utils.ts`
```typescript
cn(...classes): string
// Merge Tailwind classes using clsx and tailwind-merge
```

### 7.2 Storage Layer

**File:** `server/storage.ts`

**Interface:** `IStorage` with 40+ methods

**Key Operations:**
- User management (getUser, upsertUser)
- Patient operations (create, get, search by NIC)
- Doctor operations (create, get by specialization)
- Appointment CRUD
- Medical record management
- Prescription lifecycle
- Medicine inventory
- Lab test workflow
- Billing and payments
- Notifications
- Chat messages

**Implementation:** `DatabaseStorage` class using Drizzle ORM

### 7.3 Business Rules

**Prescription Expiry:**
- Default: 30 days from issue date
- Status transitions: active → dispensed → expired

**Low Stock Alerts:**
- Triggered when `stockQuantity <= reorderLevel`
- Notification sent to pharmacists and admins

**Appointment Status Flow:**
```
pending → confirmed → completed
        ↘ cancelled
```

**Lab Test Workflow:**
```
pending → in_progress → completed
        ↘ cancelled
```

**Bill Status:**
```
pending → paid
        ↘ cancelled
```

---

## 8. FILE STORAGE

**File:** `server/storage.ts`

**Current Implementation:**
- **Lab Test Results:** `resultFileUrl` field (VARCHAR)
- **Profile Images:** `profileImageUrl` field (VARCHAR)
- **No actual file upload implemented** in current version

**For Mobile App - Recommended Approach:**

### 8.1 File Upload Requirements

**Types of Files:**
1. Profile pictures (images)
2. Lab test results (PDFs, images)
3. Medical documents (PDFs)
4. Prescription images (images)

**Recommended Stack:**
- **Cloud Storage:** AWS S3 / Google Cloud Storage / Cloudinary
- **React Native:** `react-native-image-picker` or Expo ImagePicker
- **Upload Strategy:** Direct upload to cloud with signed URLs
- **CDN:** CloudFront / Cloudflare for fast delivery

### 8.2 Implementation Plan

**Backend API Addition:**
```typescript
POST /api/upload/profile-picture
POST /api/upload/lab-result
POST /api/upload/document
GET  /api/files/:fileId
```

**Mobile Upload Flow:**
1. Select file from device
2. Request signed upload URL from backend
3. Upload directly to cloud storage
4. Backend stores file URL in database
5. Retrieve via CDN for display

**Database Changes:**
```typescript
// Add to schema
fileUploads table:
- id, userId, fileType, url, filename, size, mimeType, createdAt
```

---

## 9. SPECIAL MOBILE CONSIDERATIONS

### 9.1 Offline Support

**Current State:** None (requires active connection)

**Recommendations:**
- Use React Native's AsyncStorage for caching
- Implement offline queue for mutations
- Use TanStack Query's persistence plugin
- Cache critical data: appointments, prescriptions, medical records

**Priority Features for Offline:**
1. View appointments (read-only)
2. View prescriptions (read-only)
3. View medical records (read-only)
4. Queue messages for sending

### 9.2 Push Notifications

**Current State:** In-app notifications only

**Mobile Requirements:**
- **Appointment reminders** (1 day before, 1 hour before)
- **Prescription ready** alerts
- **Lab results available** notifications
- **Low stock alerts** (pharmacists)
- **New messages** from healthcare providers

**Implementation Stack:**
- Firebase Cloud Messaging (FCM) for Android
- Apple Push Notification Service (APNs) for iOS
- Expo Notifications (if using Expo)

**Backend Changes Needed:**
```typescript
// Add to users table
pushTokens: text[] // Array of device tokens

// New endpoints
POST /api/notifications/register-device
POST /api/notifications/send-push
```

### 9.3 QR Code Functionality

**Current Implementation:**
- QR codes generated as text strings
- Stored in `qrCode` field

**Mobile Requirements:**
- **Scanning:** `react-native-camera` or Expo Camera
- **Generation:** `react-native-qrcode-svg`
- **Verification:** API endpoint to validate QR code

**New API Endpoint:**
```typescript
POST /api/prescriptions/verify-qr
Body: { qrCode: string }
Response: { valid: boolean, prescription: {...} }
```

### 9.4 Real-time Features

**Current Implementation:**
- WebSocket at `/ws` path
- Session-based authentication
- Broadcast messaging

**Mobile Adaptation:**
- Use `socket.io-client` for React Native
- Handle reconnection logic
- Background state management
- Battery optimization

**Considerations:**
- Keep-alive messages
- Reconnection on network change
- Background WebSocket limitations on iOS

### 9.5 Biometric Authentication

**Recommendation:** Add fingerprint/Face ID support

**Libraries:**
- `react-native-biometrics`
- Expo Local Authentication

**Implementation:**
- Store encrypted token in Keychain (iOS) / Keystore (Android)
- Optional biometric unlock
- Fallback to password

### 9.6 Location Services

**Potential Use Cases:**
- Find nearest pharmacy
- Find nearest lab
- Emergency services
- Doctor location (if applicable)

**Not currently in web app** - consider for mobile enhancement

### 9.7 Camera Integration

**Use Cases:**
1. Profile picture capture
2. QR code scanning (prescriptions)
3. Document scanning (lab results, medical documents)
4. Telemedicine video calls (future)

**Libraries:**
- `react-native-camera` or Expo Camera
- `react-native-image-picker`
- `react-native-document-scanner` (optional)

---

## 10. TECHNOLOGY STACK SUMMARY

### 10.1 Frontend (Web)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | Latest |
| Build Tool | Vite | Latest |
| Routing | Wouter | 3.3.5 |
| Styling | Tailwind CSS | 4.x |
| UI Library | shadcn/ui + Radix UI | Latest |
| State Management | TanStack Query | 5.60.5 |
| Form Management | React Hook Form | 7.55.0 |
| Validation | Zod | 3.24.2 |
| Date Utils | date-fns | 3.6.0 |
| Icons | Lucide React | 0.453.0 |
| Animation | Framer Motion | 11.13.1 |
| Charts | Recharts | 2.15.2 |

### 10.2 Backend

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express | 4.21.2 |
| Language | TypeScript | Latest |
| Authentication | Passport.js | 0.7.0 |
| Password Hashing | bcryptjs | 3.0.3 |
| Session Store | connect-pg-simple | 10.0.0 |
| WebSocket | ws | 8.18.0 |
| QR Code | qrcode | 1.5.4 |
| Validation | Zod | 3.24.2 |

### 10.3 Database

| Category | Technology | Version |
|----------|-----------|---------|
| Database | PostgreSQL | 15+ |
| ORM | Drizzle ORM | 0.39.1 |
| Client | pg | 8.16.3 |
| Migrations | Drizzle Kit | Latest |

### 10.4 Recommended Mobile Stack

| Category | Technology | Reason |
|----------|-----------|--------|
| Framework | React Native | Code reuse, large ecosystem |
| Navigation | React Navigation | Industry standard |
| State | TanStack Query | Already used in web |
| UI Library | React Native Paper / NativeBase | Component consistency |
| Forms | React Hook Form | Already used in web |
| Storage | AsyncStorage + MMKV | Fast local storage |
| Networking | Axios + TanStack Query | Consistent with web |
| Push | Firebase Cloud Messaging | Cross-platform |
| Camera | react-native-vision-camera | Modern, performant |
| Biometrics | react-native-biometrics | Native auth |
| QR Scanner | react-native-vision-camera | Integrated solution |
| Charts | react-native-svg + Victory Native | Similar to Recharts |

---

## 11. API CONVENTIONS & PATTERNS

### 11.1 Request Patterns

**Authentication:**
- All requests require `credentials: 'include'` for session cookies

**Headers:**
```typescript
{
  "Content-Type": "application/json"
}
```

**Body Validation:**
- Zod schemas validate all inputs
- Validation errors return 400 with descriptive messages

### 11.2 Response Patterns

**Success (200/201):**
```json
{
  "id": "uuid",
  "field1": "value",
  ...
}
```

**Error (4xx/5xx):**
```json
{
  "message": "Human-readable error message"
}
```

### 11.3 Pagination

**Current State:** Not implemented

**Recommendation for Mobile:**
```typescript
GET /api/endpoint?page=1&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNext": true
  }
}
```

### 11.4 Filtering

**Current State:** Basic filtering by user role

**Recommendation:**
```typescript
GET /api/appointments?status=confirmed&date=2025-01-20
GET /api/prescriptions?status=active
GET /api/medicines?category=antibiotic&inStock=true
```

---

## 12. SECURITY CONSIDERATIONS

### 12.1 Current Security Features

✅ Session-based authentication
✅ bcrypt password hashing (10 rounds)
✅ Role-based access control (RBAC)
✅ HTTP-only session cookies
✅ Secure cookies in production
✅ WebSocket authentication
✅ SQL injection protection (parameterized queries via Drizzle)

### 12.2 Recommendations for Mobile

**Additional Security:**
- HTTPS enforcement
- Certificate pinning
- Encrypted local storage
- Biometric authentication
- Token refresh mechanism
- Rate limiting on API
- CSRF protection (not needed for API-only)
- Input sanitization

**Sensitive Data:**
- Never log passwords
- Encrypt medical records at rest
- Implement audit logging for PHI access
- HIPAA/GDPR compliance considerations

---

## 13. DEPLOYMENT & ENVIRONMENT

### 13.1 Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=min-32-characters-secret-key
NODE_ENV=development|production
PORT=5000
```

### 13.2 Scripts

```json
{
  "dev": "tsx server/index.ts",
  "build": "vite build && esbuild server",
  "start": "node dist/index.js",
  "db:push": "drizzle-kit push",
  "seed": "tsx scripts/seed-database.ts",
  "create-admin": "tsx scripts/create-admin.ts"
}
```

### 13.3 Mobile Backend Requirements

**No changes needed** for basic mobile app support

**Optional Enhancements:**
- Add API versioning (`/api/v1/...`)
- GraphQL endpoint (for complex queries)
- File upload endpoints
- Push notification service
- Background job processing (for notifications)

---

## 14. TESTING CONSIDERATIONS

### 14.1 Current Testing

**Minimal test coverage** - `data-testid` attributes present

### 14.2 Mobile Testing Strategy

**Recommended Tools:**
- Jest for unit tests
- React Native Testing Library
- Detox for E2E tests
- Maestro for UI automation

**Critical Test Areas:**
1. Authentication flow
2. Appointment booking
3. Prescription viewing
4. QR code scanning
5. Offline data access
6. Push notification handling

---

## 15. MIGRATION STRATEGY (Web → Mobile)

### 15.1 Reusable Code

**High Reuse (80-90%):**
- All API integration logic
- Authentication hooks
- Data models (TypeScript types)
- Business logic utilities
- Form validation schemas

**Medium Reuse (50-70%):**
- Component structure
- State management patterns
- Navigation logic

**Low Reuse (0-30%):**
- UI components (need React Native equivalents)
- Styling (Tailwind → StyleSheet)
- Browser-specific features

### 15.2 Architecture Mapping

| Web | Mobile |
|-----|--------|
| Wouter | React Navigation |
| shadcn/ui | React Native Paper |
| Tailwind CSS | StyleSheet / Styled Components |
| Fetch API | Axios (better for mobile) |
| LocalStorage | AsyncStorage + MMKV |
| WebSocket | socket.io-client |

### 15.3 Development Approach

**Phase 1: Core Features**
1. Authentication
2. Dashboard
3. Appointments
4. Medical Records
5. Prescriptions

**Phase 2: Enhanced Features**
6. Notifications
7. Messaging
8. QR Scanning
9. Offline Support

**Phase 3: Mobile-Specific**
10. Push Notifications
11. Biometric Auth
12. Camera Integration
13. Location Services

---

## 16. PERFORMANCE CONSIDERATIONS

### 16.1 Current Optimizations

- React Query caching
- Stale-while-revalidate pattern
- Component lazy loading potential
- Image optimization needs

### 16.2 Mobile-Specific Optimizations

**Critical for Mobile:**
- Implement pagination (not currently present)
- Add image compression before upload
- Lazy load lists with FlatList
- Implement pull-to-refresh
- Cache images locally
- Optimize WebSocket reconnections
- Reduce bundle size (code splitting)

**Performance Targets:**
- App launch: < 3 seconds
- API response: < 500ms
- Image load: < 2 seconds
- Offline cache: < 5MB initial

---

## 17. ACCESSIBILITY

### 17.1 Current State

- semantic HTML structure
- Keyboard navigation support (Radix UI)
- ARIA attributes (via Radix)

### 17.2 Mobile Accessibility

**Must Implement:**
- Screen reader support (iOS VoiceOver, Android TalkBack)
- Sufficient touch targets (44x44pt minimum)
- Color contrast (WCAG AA minimum)
- Text scaling support
- Focus indicators
- Alternative text for images
- Keyboard navigation (for external keyboards)

---

## 18. ANALYTICS & MONITORING

### 18.1 Current State

**No analytics implementation**

### 18.2 Recommendations

**Mobile Analytics:**
- Firebase Analytics
- Mixpanel for user behavior
- Sentry for error tracking
- Performance monitoring (Firebase Performance)

**Key Metrics to Track:**
1. User authentication success rate
2. Appointment booking completion
3. Prescription view/download rate
4. QR scan success rate
5. Push notification open rate
6. App crash rate
7. API error rate
8. Screen view duration

---

## 19. COMPLETE FILE STRUCTURE FOR REACT NATIVE MOBILE APP

```
medivault-mobile/
├── .expo/                              # Expo configuration (if using Expo)
├── .vscode/
│   └── settings.json
├── android/                            # Native Android code
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── ios/                                # Native iOS code
│   ├── MediVault/
│   ├── MediVault.xcodeproj/
│   └── Podfile
├── src/
│   ├── api/                           # API integration layer
│   │   ├── index.ts                   # API client (axios setup)
│   │   ├── auth.ts                    # Authentication endpoints
│   │   ├── appointments.ts            # Appointment endpoints
│   │   ├── patients.ts                # Patient endpoints
│   │   ├── doctors.ts                 # Doctor endpoints
│   │   ├── medicalRecords.ts          # Medical record endpoints
│   │   ├── prescriptions.ts           # Prescription endpoints
│   │   ├── medicines.ts               # Medicine endpoints
│   │   ├── labTests.ts                # Lab test endpoints
│   │   ├── bills.ts                   # Billing endpoints
│   │   ├── payments.ts                # Payment endpoints
│   │   ├── notifications.ts           # Notification endpoints
│   │   ├── messages.ts                # Message endpoints
│   │   └── websocket.ts               # WebSocket client
│   │
│   ├── assets/                        # Static assets
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   ├── splash.png
│   │   │   └── onboarding/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/                    # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Separator.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormError.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Checkbox.tsx
│   │   │
│   │   ├── lists/
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── PrescriptionCard.tsx
│   │   │   ├── MedicalRecordCard.tsx
│   │   │   ├── LabTestCard.tsx
│   │   │   ├── MedicineCard.tsx
│   │   │   ├── NotificationCard.tsx
│   │   │   └── MessageCard.tsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── TabBar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── DrawerContent.tsx
│   │   │
│   │   ├── modals/
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ActionSheet.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── ConfirmModal.tsx
│   │   │
│   │   ├── qr/
│   │   │   ├── QRScanner.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── QRDisplay.tsx
│   │   │
│   │   └── charts/
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       └── StatCard.tsx
│   │
│   ├── config/                        # App configuration
│   │   ├── constants.ts               # App constants
│   │   ├── theme.ts                   # Theme configuration
│   │   ├── navigation.ts              # Navigation config
│   │   └── permissions.ts             # Permission configs
│   │
│   ├── contexts/                      # React contexts
│   │   ├── AuthContext.tsx            # Authentication context
│   │   ├── ThemeContext.tsx           # Theme context
│   │   └── NotificationContext.tsx    # Notification context
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Authentication hook
│   │   ├── useTheme.ts                # Theme hook
│   │   ├── useNetwork.ts              # Network status hook
│   │   ├── useNotifications.ts        # Push notifications hook
│   │   ├── useBiometrics.ts           # Biometric auth hook
│   │   ├── useCamera.ts               # Camera hook
│   │   ├── useLocation.ts             # Location hook
│   │   ├── useWebSocket.ts            # WebSocket hook
│   │   ├── useOfflineQueue.ts         # Offline sync hook
│   │   └── usePermissions.ts          # Permissions hook
│   │
│   ├── navigation/                    # Navigation setup
│   │   ├── AppNavigator.tsx           # Root navigator
│   │   ├── AuthNavigator.tsx          # Auth stack
│   │   ├── MainNavigator.tsx          # Main tab navigator
│   │   ├── DashboardNavigator.tsx     # Dashboard stack
│   │   ├── AppointmentNavigator.tsx   # Appointments stack
│   │   ├── RecordsNavigator.tsx       # Medical records stack
│   │   ├── PrescriptionNavigator.tsx  # Prescriptions stack
│   │   ├── MessagesNavigator.tsx      # Messages stack
│   │   └── types.ts                   # Navigation types
│   │
│   ├── screens/                       # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── BiometricSetupScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── PharmacistDashboard.tsx
│   │   │   ├── LabTechDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   │
│   │   ├── appointments/
│   │   │   ├── AppointmentsListScreen.tsx
│   │   │   ├── AppointmentDetailScreen.tsx
│   │   │   ├── BookAppointmentScreen.tsx
│   │   │   ├── AppointmentCalendarScreen.tsx
│   │   │   └── DoctorListScreen.tsx
│   │   │
│   │   ├── medicalRecords/
│   │   │   ├── MedicalRecordsListScreen.tsx
│   │   │   ├── MedicalRecordDetailScreen.tsx
│   │   │   ├── CreateRecordScreen.tsx (Doctor)
│   │   │   ├── VitalSignsScreen.tsx
│   │   │   └── HealthSummaryScreen.tsx
│   │   │
│   │   ├── prescriptions/
│   │   │   ├── PrescriptionsListScreen.tsx
│   │   │   ├── PrescriptionDetailScreen.tsx
│   │   │   ├── CreatePrescriptionScreen.tsx (Doctor)
│   │   │   ├── PrescriptionQRScreen.tsx
│   │   │   ├── ScanPrescriptionScreen.tsx (Pharmacist)
│   │   │   └── DispensePrescriptionScreen.tsx (Pharmacist)
│   │   │
│   │   ├── medicines/
│   │   │   ├── MedicineListScreen.tsx (Pharmacist)
│   │   │   ├── MedicineDetailScreen.tsx
│   │   │   ├── AddMedicineScreen.tsx (Pharmacist)
│   │   │   ├── UpdateStockScreen.tsx (Pharmacist)
│   │   │   └── LowStockAlertsScreen.tsx (Pharmacist)
│   │   │
│   │   ├── labTests/
│   │   │   ├── LabTestsListScreen.tsx
│   │   │   ├── LabTestDetailScreen.tsx
│   │   │   ├── OrderLabTestScreen.tsx (Doctor)
│   │   │   ├── UpdateTestResultScreen.tsx (Lab Tech)
│   │   │   └── UploadResultScreen.tsx (Lab Tech)
│   │   │
│   │   ├── billing/
│   │   │   ├── BillsListScreen.tsx
│   │   │   ├── BillDetailScreen.tsx
│   │   │   ├── PaymentScreen.tsx
│   │   │   └── PaymentHistoryScreen.tsx
│   │   │
│   │   ├── messages/
│   │   │   ├── ConversationsListScreen.tsx
│   │   │   ├── ChatScreen.tsx
│   │   │   └── NewMessageScreen.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationsScreen.tsx
│   │   │   └── NotificationSettingsScreen.tsx
│   │   │
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── EditProfileScreen.tsx
│   │       ├── ChangePasswordScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── AboutScreen.tsx
│   │
│   ├── services/                      # Business logic services
│   │   ├── authService.ts             # Authentication logic
│   │   ├── biometricService.ts        # Biometric authentication
│   │   ├── cameraService.ts           # Camera operations
│   │   ├── locationService.ts         # Location services
│   │   ├── notificationService.ts     # Push notifications
│   │   ├── offlineService.ts          # Offline sync
│   │   ├── qrService.ts               # QR code operations
│   │   ├── storageService.ts          # Local storage
│   │   ├── uploadService.ts           # File uploads
│   │   └── websocketService.ts        # WebSocket handling
│   │
│   ├── store/                         # State management
│   │   ├── queryClient.ts             # TanStack Query setup
│   │   ├── queries/
│   │   │   ├── useAppointments.ts     # Appointment queries
│   │   │   ├── useMedicalRecords.ts   # Medical record queries
│   │   │   ├── usePrescriptions.ts    # Prescription queries
│   │   │   ├── useMedicines.ts        # Medicine queries
│   │   │   ├── useLabTests.ts         # Lab test queries
│   │   │   ├── useBills.ts            # Bill queries
│   │   │   ├── useMessages.ts         # Message queries
│   │   │   └── useNotifications.ts    # Notification queries
│   │   │
│   │   └── mutations/
│   │       ├── useCreateAppointment.ts
│   │       ├── useUpdateAppointment.ts
│   │       ├── useCreateRecord.ts
│   │       ├── useCreatePrescription.ts
│   │       ├── useUpdateStock.ts
│   │       ├── useSendMessage.ts
│   │       └── useMarkNotificationRead.ts
│   │
│   ├── types/                         # TypeScript types
│   │   ├── api.ts                     # API types
│   │   ├── auth.ts                    # Auth types
│   │   ├── models.ts                  # Data models (from shared/schema.ts)
│   │   ├── navigation.ts              # Navigation types
│   │   └── index.ts                   # Type exports
│   │
│   ├── utils/                         # Utility functions
│   │   ├── dateUtils.ts               # Date formatting
│   │   ├── formatters.ts              # Data formatters
│   │   ├── validators.ts              # Validation helpers
│   │   ├── permissions.ts             # Permission checks
│   │   ├── error.ts                   # Error handling
│   │   ├── crypto.ts                  # Encryption utilities
│   │   └── helpers.ts                 # General helpers
│   │
│   ├── validations/                   # Zod schemas
│   │   ├── authSchemas.ts             # Auth validation
│   │   ├── appointmentSchemas.ts      # Appointment validation
│   │   ├── prescriptionSchemas.ts     # Prescription validation
│   │   ├── medicineSchemas.ts         # Medicine validation
│   │   └── profileSchemas.ts          # Profile validation
│   │
│   └── App.tsx                        # Root component
│
├── .env.development                   # Development environment
├── .env.production                    # Production environment
├── .eslintrc.js                       # ESLint config
├── .gitignore
├── .prettierrc                        # Prettier config
├── app.json                           # Expo/app config
├── babel.config.js                    # Babel config
├── index.js                           # Entry point
├── metro.config.js                    # Metro bundler config
├── package.json                       # Dependencies
├── README.md
├── tsconfig.json                      # TypeScript config
└── yarn.lock / package-lock.json
```

---

## 20. IMPLEMENTATION STEPS

### Step 1: Project Initialization
**Initialize React Native project** with TypeScript, set up navigation (React Navigation v6), install core dependencies: TanStack Query, Axios, AsyncStorage, MMKV, socket.io-client, and configure folder structure matching above.

### Step 2: Authentication System
**Implement authentication system** in `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/api/auth.ts`, and `src/services/authService.ts` with session-based login, secure token storage in Keychain/Keystore, biometric authentication using `react-native-biometrics`, and offline auth state persistence.

### Step 3: Role-Based Navigation
**Create role-based navigation** in `src/navigation/AppNavigator.tsx` with tab/stack navigators for each role (Patient, Doctor, Pharmacist, Lab Technician, Admin), implement role-specific dashboard screens in `src/screens/dashboard/`, and add bottom tab navigation with icons.

### Step 4: Core Feature Screens
**Build core feature screens** for appointments (`src/screens/appointments/`), medical records (`src/screens/medicalRecords/`), prescriptions (`src/screens/prescriptions/`), lab tests (`src/screens/labTests/`), and messages (`src/screens/messages/`) using `FlatList` for data, pull-to-refresh, and React Hook Form with Zod validation.

### Step 5: QR Code Functionality
**Integrate QR code functionality** in `src/components/qr/` using `react-native-vision-camera` for scanning prescriptions (pharmacist), `react-native-qrcode-svg` for generating/displaying prescription QR codes, add `src/api/prescriptions.ts` verify endpoint, and implement camera permissions handling.

### Step 6: WebSocket Messaging
**Implement WebSocket messaging** in `src/services/websocketService.ts` and `src/hooks/useWebSocket.ts` using socket.io-client, handle reconnection logic and background state, build chat UI in `src/screens/messages/ChatScreen.tsx`, and add typing indicators and message status.

### Step 7: Push Notifications
**Add push notifications** using Firebase Cloud Messaging, implement device token registration in `src/services/notificationService.ts`, handle foreground/background/quit state notifications, create backend endpoints `POST /api/notifications/register-device` and update notification sending logic, and configure deep linking for notification actions.

### Step 8: Offline Support
**Implement offline support** in `src/services/offlineService.ts` with TanStack Query persistence plugin, cache critical data (appointments, prescriptions, medical records) in MMKV, create offline mutation queue in `src/hooks/useOfflineQueue.ts`, add network status detection with `src/hooks/useNetwork.ts`, and show offline indicators in UI.

### Step 9: File Upload Capabilities
**Add file upload capabilities** for profile pictures and lab results, create `src/services/uploadService.ts` with image picker and compression, implement backend endpoints (`POST /api/upload/profile-picture`, `POST /api/upload/lab-result`), integrate cloud storage (AWS S3/Cloudinary) with signed URLs, and display uploaded images with caching.

### Step 10: UI Components Library
**Implement UI components library** in `src/components/` replicating shadcn/ui equivalents using React Native Paper or NativeBase, create reusable Button, Input, Card, Select, DatePicker components, add dark/light theme support in `src/contexts/ThemeContext.tsx`, and ensure accessibility (screen reader support, touch targets 44x44pt).

### Step 11: Pagination and Optimization
**Add pagination and optimization** to all list screens, implement infinite scroll with TanStack Query's `useInfiniteQuery`, update backend API to support `?page=1&limit=20` parameters, optimize images with lazy loading and caching (react-native-fast-image), and reduce initial bundle size with code splitting.

---

## 21. FURTHER CONSIDERATIONS

### 1. Platform-Specific Implementations
**Question:** Should native modules be used for critical features (biometrics, camera, push notifications) or stick with Expo managed workflow?

**Analysis:** Expo provides faster development but less flexibility; bare React Native offers full control.

**Recommendation:** Start with Expo for rapid prototyping, eject if native modules are required.

### 2. Backend API Versioning
**Issue:** Current API has no versioning; mobile apps can't force users to update.

**Recommendation:** Add API versioning (`/api/v1/...`) to support backward compatibility and graceful deprecation when schema changes.

### 3. Testing Strategy
**Question:** What level of testing coverage is needed?

**Recommendation:**
- Unit tests (Jest) for utilities/services (>80%)
- Integration tests for API calls
- E2E tests (Detox/Maestro) for critical flows (login, booking appointment, QR scanning)

### 4. File Storage Implementation
**Issue:** Backend currently has no file upload; cloud storage (AWS S3, Cloudinary) integration is needed.

**Question:** Should files be uploaded directly from mobile to cloud (signed URLs) or proxied through backend?

**Recommendation:** Direct upload recommended for better performance and reduced server load.

### 5. Offline Conflict Resolution
**Question:** When user makes changes offline and syncs later, how to handle conflicts?

**Recommendation:**
- Last-write-wins for simple fields
- Prompt user for critical data (prescription changes)
- Version timestamps for conflict detection

---

## 22. CONCLUSION & KEY TAKEAWAYS

### Architecture Strengths:
✅ Clean separation of concerns (client/server/shared)
✅ Type-safe end-to-end (TypeScript + Zod)
✅ Robust authentication and authorization
✅ Comprehensive database schema
✅ Role-based access control
✅ Real-time messaging capability

### Mobile App Requirements:
1. **Must Have:**
   - React Native framework
   - Navigation system (React Navigation)
   - State management (TanStack Query)
   - Secure authentication (session + biometric)
   - Offline data caching
   - Push notifications
   - QR code scanning

2. **API Changes Needed:**
   - Minimal changes required
   - Add file upload endpoints
   - Add push notification endpoints
   - Consider pagination for lists

3. **New Mobile Features:**
   - Camera integration
   - Biometric authentication
   - Offline mode
   - Push notifications
   - QR code scanner
   - Location services (optional)

### Estimated Development Timeline:
- **Phase 1 (Core):** 8-10 weeks
- **Phase 2 (Enhanced):** 4-6 weeks
- **Phase 3 (Mobile-Specific):** 4-6 weeks
- **Total:** 16-22 weeks

### Team Composition:
- 2-3 React Native developers
- 1 Backend developer (API enhancements)
- 1 UI/UX designer (mobile adaptations)
- 1 QA engineer

---

**Report Compiled:** Based on comprehensive analysis of MediVault web application codebase
**Target:** React Native mobile app development planning
**Completeness:** All major architectural components documented
