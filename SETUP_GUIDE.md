# MediVault Mobile - Quick Setup Guide

## 🎯 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd "C:\Users\Deneth\Desktop\Programmes\MediVault\Updated\Mobile\MediVault"
npm install
```

### Step 2: Configure Environment

The `.env.development` file is already configured. Update if needed:

```env
API_BASE_URL=http://localhost:5000/api
WS_URL=ws://localhost:5000
```

### Step 3: Run the Backend

Make sure your MediVault backend server is running:

```bash
cd "C:\Users\Deneth\Desktop\Programmes\MediVault\Updated\Under Development\MediVault-Dev"
npm run dev
```

### Step 4: Start Mobile App

```bash
# Start Metro bundler
npm start

# In another terminal - Run on Android
npm run android

# OR Run on iOS (macOS only)
npm run ios
```

## 📱 Platform Setup

### Android Setup

1. **Install Android Studio** with Android SDK
2. **Configure environment variables**:
   ```bash
   ANDROID_HOME=C:\Users\<YourUser>\AppData\Local\Android\Sdk
   ```
3. **Start an emulator** or connect a device
4. **Run**: `npm run android`

### iOS Setup (macOS only)

1. **Install Xcode** from App Store
2. **Install CocoaPods**: `sudo gem install cocoapods`
3. **Install pods**: `cd ios && pod install && cd ..`
4. **Run**: `npm run ios`

## 🔨 Next Implementation Steps

The foundation is complete. Here's what to build next:

### Phase 1: Core Services (Week 1)

Create these service files in `src/services/`:

1. **authService.ts**

   ```typescript
   // Handle login, logout, session management
   // Use authApi from src/api/auth.ts
   ```

2. **biometricService.ts**

   ```typescript
   // Implement Face ID/Touch ID authentication
   // Use react-native-biometrics
   ```

3. **notificationService.ts**
   ```typescript
   // Setup Firebase Cloud Messaging
   // Handle push notification registration
   ```

### Phase 2: Contexts (Week 1)

Create these context files in `src/contexts/`:

1. **AuthContext.tsx**

   ```typescript
   // Manage authentication state
   // Provide login/logout functions
   // Check biometric availability
   ```

2. **ThemeContext.tsx**

   ```typescript
   // Manage light/dark theme
   // Use storageService for persistence
   ```

3. **NotificationContext.tsx**
   ```typescript
   // Manage notification state
   // Handle notification actions
   ```

### Phase 3: Navigation (Week 2)

Create these navigator files in `src/navigation/`:

1. **AuthNavigator.tsx**

   ```typescript
   // Stack: Login → Register → ForgotPassword
   ```

2. **MainNavigator.tsx**

   ```typescript
   // Tab navigator based on user role
   // Use TAB_CONFIG from src/config/navigation.ts
   ```

3. **AppNavigator.tsx**
   ```typescript
   // Root navigator: Splash → Auth or Main
   // Check authentication status
   ```

### Phase 4: Authentication Screens (Week 2)

Create in `src/screens/auth/`:

1. **LoginScreen.tsx** - Email/password login with biometric option
2. **RegisterScreen.tsx** - Multi-step registration form
3. **ForgotPasswordScreen.tsx** - Password reset
4. **BiometricSetupScreen.tsx** - Enable biometric authentication

### Phase 5: Main Feature Screens (Week 3-6)

Create screens for each role:

**Patient Screens** (`src/screens/`):

- `dashboard/PatientDashboard.tsx` - Overview with stats
- `appointments/AppointmentList.tsx` - List appointments
- `appointments/AppointmentBooking.tsx` - Book new appointment
- `medical-records/MedicalRecordList.tsx` - View records
- `prescriptions/PrescriptionList.tsx` - View prescriptions
- `prescriptions/PrescriptionQRDisplay.tsx` - Show QR code

**Doctor Screens**:

- `dashboard/DoctorDashboard.tsx` - Patient stats
- `patients/PatientList.tsx` - Manage patients
- `medical-records/MedicalRecordCreate.tsx` - Create records
- `prescriptions/PrescriptionCreate.tsx` - Issue prescriptions

**Pharmacist Screens**:

- `dashboard/PharmacistDashboard.tsx` - Inventory overview
- `prescriptions/PrescriptionQRScan.tsx` - Scan QR to verify
- `medicines/MedicineInventory.tsx` - Stock management

**Lab Technician Screens**:

- `dashboard/LabTechnicianDashboard.tsx` - Test overview
- `lab-tests/LabTestList.tsx` - View test orders
- `lab-tests/LabTestUpload.tsx` - Upload results

## 🎨 Component Creation

Create reusable components in `src/components/`:

### Common Components (`components/common/`)

- Button.tsx
- Input.tsx
- Card.tsx
- Avatar.tsx
- Badge.tsx
- LoadingScreen.tsx
- ErrorBoundary.tsx

### Form Components (`components/forms/`)

- FormField.tsx
- DatePicker.tsx
- TimePicker.tsx
- Select.tsx

### List Components (`components/lists/`)

- AppointmentCard.tsx
- PrescriptionCard.tsx
- MedicalRecordCard.tsx

## 🔌 Custom Hooks

Create in `src/hooks/`:

```typescript
// useAuth.ts - Authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

// useAppointments.ts - Appointments data
export const useAppointments = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentsApi.getAppointments,
  });
};

// Similar hooks for other entities
```

## 🔄 WebSocket Integration

In `src/services/websocketService.ts`:

```typescript
import { websocketClient } from '@api/websocket';

// Connect on login
await websocketClient.connect();

// Listen for events
websocketClient.on('message:new', handleNewMessage);
websocketClient.on('notification:new', handleNewNotification);

// Disconnect on logout
websocketClient.disconnect();
```

## 📊 Query Hooks Pattern

Create in `src/store/hooks/`:

```typescript
// useAppointments.ts
export const useAppointments = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAppointments(),
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
```

## 🎯 Implementation Priority

1. ✅ **Foundation** - DONE (configuration, API, types, storage)
2. 🔨 **Core Services** - authService, biometricService (Week 1)
3. 🔨 **Contexts** - AuthContext, ThemeContext (Week 1)
4. 🔨 **Navigation** - All navigators (Week 2)
5. 🔨 **Auth Screens** - Login, Register (Week 2)
6. 🔨 **Main Screens** - Dashboard, Appointments, Records (Week 3-6)
7. 🔨 **Advanced Features** - QR scanning, Push notifications (Week 7-8)

## 🐛 Common Issues

### Import Errors (Expected)

Current TypeScript errors will resolve after `npm install`:

- axios not found → Fixed by npm install
- react-native-paper not found → Fixed by npm install
- @tanstack/react-query not found → Fixed by npm install

### Path Alias Issues

If imports like `@api/auth` don't work:

1. Restart TypeScript server in VS Code
2. Restart Metro bundler: `npm start -- --reset-cache`

### Build Errors

**Android**:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS**:

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

## 📚 Resources

- **API Docs**: Check `src/api/` files for all available endpoints
- **Types**: See `src/types/models.ts` for all data structures
- **Theme**: Customize in `src/config/theme.ts`
- **Constants**: App-wide constants in `src/config/constants.ts`

## ✅ Checklist

- [ ] Run `npm install`
- [ ] Start backend server
- [ ] Update `.env.development` with API URL
- [ ] Run `npm start`
- [ ] Run `npm run android` or `npm run ios`
- [ ] Create authService.ts
- [ ] Create AuthContext.tsx
- [ ] Create AppNavigator.tsx
- [ ] Create LoginScreen.tsx
- [ ] Test login flow

## 🎉 You're Ready!

The foundation is complete with:

- ✅ 40+ files created
- ✅ Complete API layer (14 endpoints)
- ✅ All TypeScript types
- ✅ Storage service
- ✅ Configuration files
- ✅ Utility functions

Now follow the implementation phases above to build the complete app!
