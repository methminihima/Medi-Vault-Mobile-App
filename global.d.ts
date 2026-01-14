// Global type declarations for the project

/// <reference types="node" />

declare const __DEV__: boolean;
declare const require: NodeRequire;

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module 'expo-print';
declare module 'expo-sharing';
