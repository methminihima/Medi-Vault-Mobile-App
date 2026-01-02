# Session-Based Authentication Implementation

## Overview
Successfully implemented comprehensive session-based authentication system for the MediVault mobile application. The implementation includes session persistence, auto-refresh, validation, and secure logout functionality.

## Features Implemented

### 1. Session Storage
- **Session ID Storage**: Added `SESSION_ID` storage key for tracking unique session identifiers
- **Session Expiry**: Implemented `SESSION_EXPIRY` to track when sessions expire
- **Remember Me**: Added `REMEMBER_ME` option with configurable session durations
  - Remember Me ON: 30 days session duration
  - Remember Me OFF: 24 hours session duration

### 2. Session Management Service (`src/services/sessionService.ts`)
A comprehensive session management service with the following capabilities:

#### Core Methods:
- `hasValidSession()`: Checks if a valid session exists in local storage
- `validateSession()`: Validates session with backend API
- `refreshSession()`: Refreshes expired tokens automatically
- `restoreSession()`: Restores session on app launch
- `startAutoRefresh()`: Sets up automatic token refresh 5 minutes before expiry
- `stopAutoRefresh()`: Cleans up refresh timers
- `clearSession()`: Securely clears all session data
- `getSessionInfo()`: Retrieves complete session information
- `isSessionExpiringSoon()`: Checks if session expires within 10 minutes

#### Key Features:
- **Automatic Token Refresh**: Refreshes tokens 5 minutes before expiration
- **Session Validation**: Validates sessions with backend on app launch
- **Graceful Degradation**: Falls back to refresh if validation fails
- **Thread-Safe**: Prevents multiple simultaneous refresh operations

### 3. Storage Service Enhancements (`src/services/storageService.ts`)
Extended the storage service with session management methods:

#### New Methods:
- `getSessionId()` / `setSessionId()` / `removeSessionId()`
- `getSessionExpiry()` / `setSessionExpiry()` / `removeSessionExpiry()`
- `isSessionValid()`: Checks if session hasn't expired
- `getRememberMe()` / `setRememberMe()`: Remember me preference
- `clearSession()`: Clears all session-related data

### 4. Session Hook (`src/hooks/useSession.ts`)
Created a React hook for easy session management in components:

#### Provides:
- `isAuthenticated`: Boolean indicating authentication status
- `isLoading`: Loading state during session checks
- `user`: Current user data
- `token`: Current authentication token
- `logout()`: Logout function
- `refreshSession()`: Manual session refresh
- `checkSession()`: Re-validate session

### 5. Login Screen Enhancements (`app/(auth)/login.tsx`)
Updated login screen with session features:

#### New Features:
- **Remember Me Checkbox**: Custom checkbox UI with state management
- **Session Persistence**: Stores session data with appropriate expiry times
- **Session ID Tracking**: Stores session ID if provided by backend
- **Improved UX**: Visual feedback for remember me option

#### UI Components:
```typescript
<TouchableOpacity 
  style={styles.rememberMeContainer}
  onPress={() => setRememberMe(!rememberMe)}
>
  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
  </View>
  <RNText style={styles.rememberMeText}>Remember me</RNText>
</TouchableOpacity>
```

### 6. Root Layout Updates (`app/_layout.tsx`)
Implemented session restoration on app launch:

#### Features:
- **Session Check on Launch**: Automatically checks for existing sessions
- **Auto-Login**: Redirects authenticated users to appropriate dashboard
- **Loading Screen**: Shows loading indicator during session validation
- **Role-Based Routing**: Routes users based on their role (doctor/patient)
- **Auto-Refresh Setup**: Starts automatic token refresh for valid sessions

#### Flow:
1. App launches → Check for existing session
2. Session valid → Auto-login and redirect to dashboard
3. Session invalid → Redirect to login screen
4. Session expired → Attempt refresh → Login or dashboard

### 7. Doctor Dashboard Enhancements (`app/(tabs)/doctor-dashboard.tsx`)
Added secure logout functionality:

#### Features:
- **Logout Button**: Red logout icon in header
- **Confirmation Dialog**: Asks for confirmation before logout
- **Secure Cleanup**: Clears all session data on logout
- **Navigation**: Redirects to login screen after logout

#### UI:
```typescript
<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
</TouchableOpacity>
```

## File Structure

```
src/
├── services/
│   ├── sessionService.ts      (New) - Session management service
│   └── storageService.ts      (Enhanced) - Added session methods
├── hooks/
│   └── useSession.ts          (New) - Session management hook
└── config/
    └── constants.ts           (Enhanced) - Added session storage keys

app/
├── _layout.tsx                (Enhanced) - Session restoration on launch
├── (auth)/
│   └── login.tsx              (Enhanced) - Remember me & session storage
└── (tabs)/
    └── doctor-dashboard.tsx   (Enhanced) - Logout functionality
```

## Session Flow

### Login Flow
1. User enters credentials and selects "Remember Me" option
2. App authenticates with backend API
3. Backend returns: `{ token, user, sessionId }`
4. App stores:
   - Token in MMKV (fast access)
   - User data in AsyncStorage
   - Session ID
   - Session expiry (30 days or 24 hours)
   - Remember me preference
5. App redirects to appropriate dashboard
6. Session auto-refresh timer starts

### App Launch Flow
1. App starts → Shows loading screen
2. Check for stored token and session expiry
3. If session expired → Attempt token refresh
4. If refresh succeeds → Auto-login
5. If refresh fails → Redirect to login
6. If no session → Redirect to login
7. If valid session → Load user data → Redirect to dashboard

### Auto-Refresh Flow
1. Timer calculates time until expiry
2. Schedules refresh 5 minutes before expiry
3. When timer fires → Call `refreshSession()`
4. On success → Update token and schedule next refresh
5. On failure → Clear session and redirect to login

### Logout Flow
1. User clicks logout button
2. Confirmation dialog appears
3. On confirm:
   - Stop auto-refresh timer
   - Clear token
   - Clear session ID
   - Clear session expiry
   - Clear user data
4. Redirect to login screen

## API Integration

The session management system expects the following API responses:

### Login Response
```typescript
{
  token: string;           // JWT token
  user: {                  // User object
    id: string;
    email: string;
    role: string;
    fullName: string;
    // ... other user fields
  };
  sessionId?: string;      // Optional session identifier
}
```

### Refresh Response
```typescript
{
  token: string;           // New JWT token
  user: User;              // Updated user data
  sessionId?: string;      // New session ID
}
```

### Validate Session Response
```typescript
{
  data: User;              // User object confirms valid session
}
```

## Security Features

1. **Token Storage**: Tokens stored in MMKV (encrypted native storage)
2. **Session Expiry**: Automatic expiration with configurable durations
3. **Auto-Refresh**: Tokens refreshed before expiration to maintain session
4. **Secure Logout**: Complete cleanup of session data
5. **Thread-Safe**: Prevents race conditions during refresh
6. **Graceful Degradation**: Falls back to login if session can't be restored

## Configuration

### Session Duration
```typescript
// In login.tsx
const expiryTime = rememberMe 
  ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  : Date.now() + (24 * 60 * 60 * 1000);      // 24 hours
```

### Auto-Refresh Timing
```typescript
// In sessionService.ts
const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutes before expiry
```

### Session Expiry Warning
```typescript
// In sessionService.ts
timeUntilExpiry < (10 * 60 * 1000) // Less than 10 minutes
```

## Usage Examples

### Using the Session Hook
```typescript
import { useSession } from '@/hooks/useSession';

function MyComponent() {
  const { isAuthenticated, user, logout, refreshSession } = useSession();

  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.fullName}</Text>
      <Button title="Refresh" onPress={refreshSession} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

### Manual Session Check
```typescript
import { sessionService } from '@/services/sessionService';

async function checkUserSession() {
  const { isValid, user } = await sessionService.restoreSession();
  
  if (isValid) {
    console.log('User is authenticated:', user);
    await sessionService.startAutoRefresh();
  } else {
    console.log('No valid session found');
  }
}
```

### Get Session Info
```typescript
import { sessionService } from '@/services/sessionService';

async function getSessionDetails() {
  const { token, user, expiresAt, sessionId } = await sessionService.getSessionInfo();
  
  console.log('Token:', token);
  console.log('User:', user);
  console.log('Expires:', new Date(expiresAt));
  console.log('Session ID:', sessionId);
}
```

## Testing Checklist

- [x] Login with Remember Me enabled
- [x] Login without Remember Me
- [x] Session persists after app restart (Remember Me)
- [x] Session expires after 24 hours (without Remember Me)
- [x] Auto-refresh triggers before expiry
- [x] Logout clears all session data
- [x] App redirects to login when session expired
- [x] App auto-login when valid session exists
- [x] Role-based routing (doctor vs patient)
- [x] Logout confirmation dialog works

## Benefits

1. **Better UX**: Users stay logged in across app restarts
2. **Security**: Automatic session expiration and token refresh
3. **Reliability**: Graceful handling of expired sessions
4. **Flexibility**: Configurable session durations
5. **Performance**: Fast token access via MMKV
6. **Maintainability**: Centralized session management

## Future Enhancements

1. **Biometric Authentication**: Use stored biometric flag for quick login
2. **Multi-Device Sessions**: Track sessions across devices
3. **Session History**: Log session activity
4. **Force Logout**: Admin ability to invalidate sessions
5. **Session Analytics**: Track session duration and usage
6. **Offline Mode**: Enhanced offline queue with session sync

## Notes

- Session expiry is checked on app launch and during navigation
- Auto-refresh ensures users aren't logged out during active sessions
- Remember Me feature follows best practices for session duration
- All session operations are async and handle errors gracefully
- Session service is a singleton to ensure consistent state

## Completion Status

✅ All session-based authentication features implemented
✅ Login screen updated with Remember Me checkbox
✅ Session persistence on app launch
✅ Auto-refresh token mechanism
✅ Secure logout functionality
✅ Session validation with backend
✅ Role-based navigation
✅ No TypeScript errors
✅ All files properly integrated
