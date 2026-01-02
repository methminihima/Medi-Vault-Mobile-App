# MediVault Animation Implementation Guide

This guide will help you add smooth, professional animations to all pages in your MediVault app using the custom animation utilities.

## 📚 Table of Contents
1. [Animation Utilities Overview](#animation-utilities-overview)
2. [Quick Start](#quick-start)
3. [Common Use Cases](#common-use-cases)
4. [Page-Specific Examples](#page-specific-examples)
5. [Best Practices](#best-practices)

---

## 🎨 Animation Utilities Overview

### Available Animation Hooks

| Hook | Description | Use Case |
|------|-------------|----------|
| `useFadeIn(delay, duration)` | Fade in from transparent | Text, images, overlays |
| `useSlideInBottom(delay, distance)` | Slide up from bottom | Cards, buttons, modals |
| `useSlideInTop(delay, distance)` | Slide down from top | Headers, notifications |
| `useSlideInLeft(delay, distance)` | Slide in from left | Sidebar items, lists |
| `useSlideInRight(delay, distance)` | Slide in from right | Navigation items |
| `useScaleIn(delay)` | Scale from small to normal | Icons, images, highlights |
| `useBounceIn(delay)` | Bouncy scale animation | Playful elements, success icons |
| `useStaggerAnimation(index, delay)` | Stagger items in lists | List items, grid cards |
| `usePressAnimation()` | Scale on press | Interactive buttons |
| `useShake()` | Shake effect | Error states, validation |
| `usePageTransition()` | Smooth page entry | Full page animations |

---

## 🚀 Quick Start

### Step 1: Import Required Modules

```tsx
import Animated from 'react-native-reanimated';
import {
  useFadeIn,
  useSlideInBottom,
  useScaleIn,
  useStaggerAnimation,
  usePressAnimation,
  usePageTransition,
} from '../../utils/animations'; // or '../utils/animations' depending on your path
```

### Step 2: Replace Standard Components

Replace standard React Native components with Animated versions:

```tsx
// Before
<View style={styles.container}>
  <Text>Hello</Text>
</View>

// After
<Animated.View style={[styles.container, useFadeIn(0, 300)]}>
  <Text>Hello</Text>
</Animated.View>
```

### Step 3: Add Animation Styles

```tsx
const MyComponent = () => {
  const fadeAnimation = useFadeIn(0, 300);
  const slideAnimation = useSlideInBottom(100, 50);
  
  return (
    <Animated.View style={[styles.container, fadeAnimation]}>
      <Animated.View style={[styles.card, slideAnimation]}>
        <Text>Animated Content</Text>
      </Animated.View>
    </Animated.View>
  );
};
```

---

## 💡 Common Use Cases

### 1. Animated Page Entry
```tsx
export default function MyPage() {
  const pageAnimation = usePageTransition();
  
  return (
    <Animated.View style={[styles.container, pageAnimation]}>
      {/* Your content */}
    </Animated.View>
  );
}
```

### 2. Animated Header
```tsx
const Header = () => {
  const headerAnimation = useSlideInTop(0);
  const logoAnimation = useScaleIn(100);
  
  return (
    <Animated.View style={[styles.header, headerAnimation]}>
      <Animated.View style={[styles.logo, logoAnimation]}>
        <Icon name="logo" />
      </Animated.View>
    </Animated.View>
  );
};
```

### 3. Staggered List Items
```tsx
const MyList = ({ items }) => {
  return (
    <View>
      {items.map((item, index) => (
        <Animated.View 
          key={item.id} 
          style={[styles.listItem, useStaggerAnimation(index, 100)]}
        >
          <Text>{item.title}</Text>
        </Animated.View>
      ))}
    </View>
  );
};
```

### 4. Interactive Button with Press Animation
```tsx
const AnimatedButton = ({ onPress, title }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.button}
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### 5. Stats/Metrics Cards
```tsx
const statsData = [/* your stats */];

return (
  <View style={styles.statsGrid}>
    {statsData.map((stat, index) => (
      <Animated.View 
        key={index} 
        style={[styles.statCard, useStaggerAnimation(index, 80)]}
      >
        <Animated.View style={useScaleIn(index * 80 + 200)}>
          <Icon name={stat.icon} />
        </Animated.View>
        <Text>{stat.value}</Text>
      </Animated.View>
    ))}
  </View>
);
```

### 6. Modal Animations
```tsx
const MyModal = ({ visible }) => {
  const modalAnimation = useScaleIn(0);
  const overlayAnimation = useFadeIn(0, 200);
  
  return (
    <Modal visible={visible} transparent>
      <Animated.View style={[styles.overlay, overlayAnimation]}>
        <Animated.View style={[styles.modalContent, modalAnimation]}>
          {/* Modal content */}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
```

### 7. Error Shake Animation
```tsx
const FormInput = () => {
  const { animatedStyle, shake } = useShake();
  const [error, setError] = useState('');
  
  const validateInput = (text) => {
    if (!text) {
      setError('Required field');
      shake(); // Trigger shake animation
    }
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TextInput onBlur={validateInput} />
      {error && <Text style={styles.error}>{error}</Text>}
    </Animated.View>
  );
};
```

---

## 📱 Page-Specific Examples

### Login/Register Pages
```tsx
import Animated from 'react-native-reanimated';
import { useFadeIn, useSlideInBottom, useScaleIn, usePressAnimation } from '../../utils/animations';

export default function LoginScreen() {
  const cardAnimation = useScaleIn(100);
  const titleAnimation = useSlideInTop(200);
  const formAnimation = useSlideInBottom(300);
  const { animatedStyle: buttonPress, onPressIn, onPressOut } = usePressAnimation();
  
  return (
    <Animated.View style={[styles.container, useFadeIn(0, 300)]}>
      <Animated.View style={[styles.card, cardAnimation]}>
        <Animated.View style={titleAnimation}>
          <Text style={styles.title}>Welcome Back</Text>
        </Animated.View>
        
        <Animated.View style={formAnimation}>
          {/* Form inputs */}
        </Animated.View>
        
        <Animated.View style={buttonPress}>
          <TouchableOpacity
            style={styles.loginButton}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handleLogin}
          >
            <Text>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
```

### Dashboard Pages
```tsx
export default function Dashboard() {
  const headerAnimation = useSlideInTop(0);
  const statsAnimation = useFadeIn(200, 400);
  
  return (
    <ScrollView>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Text>Welcome, Dr. Smith</Text>
      </Animated.View>
      
      <Animated.View style={[styles.statsContainer, statsAnimation]}>
        {stats.map((stat, index) => (
          <Animated.View 
            key={index}
            style={[styles.statCard, useStaggerAnimation(index, 100)]}
          >
            <Text>{stat.value}</Text>
          </Animated.View>
        ))}
      </Animated.View>
      
      {/* Appointments List */}
      {appointments.map((apt, index) => (
        <Animated.View 
          key={apt.id}
          style={[styles.appointmentCard, useStaggerAnimation(index, 80)]}
        >
          <Text>{apt.patientName}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}
```

### Modal/Bottom Sheet
```tsx
const AppointmentModal = ({ visible, onClose }) => {
  const overlayAnimation = useFadeIn(0, 200);
  const modalAnimation = useSlideInBottom(0, 300);
  
  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, overlayAnimation]}>
        <Animated.View style={[styles.modalContent, modalAnimation]}>
          <Text>Appointment Details</Text>
          {/* Modal content */}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
```

---

## ✨ Best Practices

### 1. **Timing & Delays**
- Keep delays between 0-200ms for immediate elements
- Use 100-150ms stagger delays for list items
- Total animation duration should be < 500ms for good UX

```tsx
// Good
const headerAnimation = useSlideInTop(0);        // Immediate
const contentAnimation = useFadeIn(100, 300);    // Quick follow
const cardsAnimation = useStaggerAnimation(index, 100); // Smooth stagger

// Avoid
const animation = useFadeIn(2000, 1000); // Too slow!
```

### 2. **Animation Combinations**
Combine multiple animations for rich effects:

```tsx
const card = () => {
  const fade = useFadeIn(0, 300);
  const slide = useSlideInBottom(0, 50);
  const scale = useScaleIn(0);
  
  // Combine animations
  return (
    <Animated.View style={[styles.card, fade, slide]}>
      <Animated.View style={scale}>
        <Icon />
      </Animated.View>
    </Animated.View>
  );
};
```

### 3. **Performance Tips**
- Don't animate too many elements simultaneously (max 10-15)
- Use `useStaggerAnimation` instead of individual delays for lists
- Avoid animating during scroll events
- Keep animation durations under 500ms

### 4. **Accessibility**
- Don't rely solely on animations for important information
- Provide alternative feedback for users with motion sensitivity
- Keep animations subtle and purposeful

### 5. **Consistency**
Use the same animation patterns throughout your app:

```tsx
// Define reusable animation configs
const PAGE_ENTER = () => usePageTransition();
const CARD_ENTER = (delay = 0) => useSlideInBottom(delay);
const BUTTON_PRESS = () => usePressAnimation();
const LIST_ITEM = (index) => useStaggerAnimation(index, 100);

// Use consistently across pages
```

### 6. **Animation Checklist**
For each page, animate:
- ✅ Page entry (fade/slide)
- ✅ Header (slide from top)
- ✅ Main content cards (stagger/scale)
- ✅ Buttons (press animation)
- ✅ Lists (stagger animation)
- ✅ Modals (scale/slide)

---

## 🎯 Quick Copy-Paste Templates

### Template 1: Basic Page with Header & Cards
```tsx
import Animated from 'react-native-reanimated';
import { usePageTransition, useSlideInTop, useStaggerAnimation } from '../../utils/animations';

export default function MyPage() {
  const pageAnimation = usePageTransition();
  const headerAnimation = useSlideInTop(0);
  
  return (
    <Animated.View style={[styles.container, pageAnimation]}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Text>Header</Text>
      </Animated.View>
      
      {items.map((item, index) => (
        <Animated.View key={item.id} style={[styles.card, useStaggerAnimation(index, 100)]}>
          <Text>{item.title}</Text>
        </Animated.View>
      ))}
    </Animated.View>
  );
}
```

### Template 2: Form with Validation
```tsx
import Animated from 'react-native-reanimated';
import { useScaleIn, useSlideInBottom, useShake, usePressAnimation } from '../../utils/animations';

export default function FormPage() {
  const formAnimation = useScaleIn(100);
  const { animatedStyle: shakeStyle, shake } = useShake();
  const { animatedStyle: buttonPress, onPressIn, onPressOut } = usePressAnimation();
  
  const handleSubmit = () => {
    if (!valid) {
      shake();
      return;
    }
    // Submit
  };
  
  return (
    <Animated.View style={[styles.container, formAnimation]}>
      <Animated.View style={shakeStyle}>
        <TextInput />
      </Animated.View>
      
      <Animated.View style={buttonPress}>
        <TouchableOpacity
          onPress={handleSubmit}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Text>Submit</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
```

---

## 🔧 Troubleshooting

### Issue: Animations not working
**Solution**: Ensure you've installed and configured `react-native-reanimated` properly in `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### Issue: Animations are jerky
**Solution**: Reduce the number of simultaneous animations or increase stagger delays.

### Issue: Page loads slowly
**Solution**: Reduce initial animation delays and duration.

---

## 📝 Summary

1. Import animation hooks from `utils/animations.ts`
2. Replace `View` with `Animated.View` for animated components
3. Apply animation styles: `style={[styles.yourStyle, animationHook()]}`
4. Use stagger animations for lists
5. Add press animations to interactive elements
6. Keep animations fast (<500ms) and purposeful

Now you're ready to add beautiful animations to all your pages! 🎉
