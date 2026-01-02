# Session Authentication Quick Reference

## Quick Start

### 1. Using Session in Components
```typescript
import { useSession } from '@/hooks/useSession';

function MyComponent() {
  const { isAuthenticated, user, logout } = useSession();
  
  return (
    <View>
      {isAuthenticated ? (
        <>
          <Text>Welcome {user?.fullName}</Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <Text>Please login</Text>
      )}
    </View>
  );
}
```

### 2. Login with Session
```typescript
import { authApi } from '@/api/auth';
import { storageService } from '@/services/storageService';

async function login(email, password, rememberMe) {
  const { data } = await authApi.login({ email, password });
  
  // Store session data
  await storageService.setToken(data.token);
  await storageService.setUser(data.user);
  await storageService.setSessionId(data.sessionId);
  
  // Set expiry based on remember me
  const expiry = rememberMe 
    ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    : Date.now() + (24 * 60 * 60 * 1000);      // 24 hours
  
  await storageService.setSessionExpiry(expiry);
  await storageService.setRememberMe(rememberMe);
}
```

### 3. Check Session Status
```typescript
import { sessionService } from '@/services/sessionService';

// Check if session is valid
const isValid = await sessionService.hasValidSession();

// Get session details
const { token, user, expiresAt } = await sessionService.getSessionInfo();

// Check if expiring soon
const expiringSoon = await sessionService.isSessionExpiringSoon();
```

### 4. Logout
```typescript
import { sessionService } from '@/services/sessionService';
import { useRouter } from 'expo-router';

async function handleLogout() {
  await sessionService.clearSession();
  router.replace('/(auth)/login');
}
```

## Key Constants

### Storage Keys
```typescript
STORAGE_KEYS.AUTH_TOKEN       // JWT token
STORAGE_KEYS.SESSION_ID       // Session identifier
STORAGE_KEYS.SESSION_EXPIRY   // Expiry timestamp
STORAGE_KEYS.REMEMBER_ME      // Remember me flag
STORAGE_KEYS.USER_DATA        // User object
```

### Session Durations
```typescript
Remember Me ON:  30 days (2,592,000,000 ms)
Remember Me OFF: 24 hours (86,400,000 ms)
Auto-Refresh:    5 minutes before expiry
Expiry Warning:  10 minutes before expiry
```

## API Endpoints

### Required Backend Endpoints
```typescript
POST /auth/login              // Login with credentials
POST /auth/refresh            // Refresh expired token
GET  /auth/me                 // Validate session
POST /auth/logout             // Logout (optional)
```

### Expected Responses
```typescript
// Login/Refresh Response
{
  token: string;
  user: User;
  sessionId?: string;
}

// Validate Response
{
  data: User;
}
```

## Common Patterns

### Protected Route Component
```typescript
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) return <ActivityIndicator />;
  if (!isAuthenticated) return null;
  
  return children;
}
```

### Session Expiry Warning
```typescript
import { sessionService } from '@/services/sessionService';
import { Alert } from 'react-native';

async function checkSessionExpiry() {
  const expiringSoon = await sessionService.isSessionExpiringSoon();
  
  if (expiringSoon) {
    Alert.alert(
      'Session Expiring',
      'Your session will expire soon. Would you like to stay logged in?',
      [
        { text: 'Logout', onPress: handleLogout },
        { 
          text: 'Stay Logged In', 
          onPress: () => sessionService.refreshSession()
        },
      ]
    );
  }
}
```

### Manual Token Refresh
```typescript
import { sessionService } from '@/services/sessionService';

async function refreshTokenManually() {
  const success = await sessionService.refreshSession();
  
  if (success) {
    console.log('Token refreshed successfully');
  } else {
    console.log('Token refresh failed - please login again');
    router.replace('/(auth)/login');
  }
}
```

## Troubleshooting

### Session Not Persisting
```typescript
// Check if data is being stored
const token = await storageService.getToken();
const expiry = await storageService.getSessionExpiry();
console.log('Token:', token);
console.log('Expiry:', new Date(expiry));
```

### Auto-Refresh Not Working
```typescript
// Ensure auto-refresh is started
await sessionService.startAutoRefresh();

// Check session info
const { expiresAt } = await sessionService.getSessionInfo();
console.log('Session expires:', new Date(expiresAt));
```

### User Logged Out Unexpectedly
```typescript
// Check session validity
const isValid = await storageService.isSessionValid();
console.log('Session valid:', isValid);

// Check if token exists
const token = await storageService.getToken();
console.log('Has token:', !!token);
```

## Best Practices

1. **Always use the session hook** for component-level authentication
2. **Check session on protected routes** to ensure user is authenticated
3. **Start auto-refresh** after successful login or session restoration
4. **Stop auto-refresh** on logout or app unmount
5. **Handle session expiry gracefully** with user-friendly messages
6. **Clear all session data** on logout for security
7. **Use remember me** for better user experience
8. **Validate sessions** with backend periodically

## Security Considerations

1. **Token Storage**: Tokens stored in MMKV (encrypted on iOS/Android)
2. **Session Expiry**: Always set appropriate expiry times
3. **Auto-Logout**: Clear session data on expiry
4. **HTTPS Only**: All API calls should use HTTPS
5. **Token Refresh**: Refresh tokens before expiry to maintain security
6. **Logout Cleanup**: Always clear all session data on logout

## Session Service API

```typescript
class SessionService {
  // Check if valid session exists
  hasValidSession(): Promise<boolean>
  
  // Validate session with backend
  validateSession(): Promise<boolean>
  
  // Refresh expired token
  refreshSession(): Promise<boolean>
  
  // Restore session on app launch
  restoreSession(): Promise<{ isValid: boolean; user: any | null }>
  
  // Start automatic token refresh
  startAutoRefresh(): Promise<void>
  
  // Stop automatic token refresh
  stopAutoRefresh(): void
  
  // Clear all session data
  clearSession(): Promise<void>
  
  // Get session information
  getSessionInfo(): Promise<{
    token: string | null;
    user: any | null;
    expiresAt: number | null;
    sessionId: string | null;
  }>
  
  // Check if session expires soon
  isSessionExpiringSoon(): Promise<boolean>
}
```

## Storage Service Session API

```typescript
class StorageService {
  // Session ID
  getSessionId(): Promise<string | null>
  setSessionId(sessionId: string): Promise<void>
  removeSessionId(): Promise<void>
  
  // Session Expiry
  getSessionExpiry(): Promise<number | null>
  setSessionExpiry(timestamp: number): Promise<void>
  removeSessionExpiry(): Promise<void>
  
  // Session Validation
  isSessionValid(): Promise<boolean>
  
  // Remember Me
  getRememberMe(): Promise<boolean>
  setRememberMe(enabled: boolean): Promise<void>
  
  // Clear Session
  clearSession(): Promise<void>
}
```

## useSession Hook API

```typescript
interface UseSessionReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  token: string | null;
  
  // Methods
  logout(): Promise<void>;
  refreshSession(): Promise<boolean>;
  checkSession(): Promise<void>;
}
```
