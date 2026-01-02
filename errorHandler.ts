// Global error handler for React Native
import { LogBox } from 'react-native';

// Suppress specific warnings (optional - remove if you want to see all warnings)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
]);

// Set up global error handler
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global error handler:', error, 'isFatal:', isFatal);
    
    // Call the default handler
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// Catch unhandled promise rejections
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', unhandledRejectionHandler);
}

export { };

