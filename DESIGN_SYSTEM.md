# UI/UX Design System Documentation

## Overview
This design system provides a comprehensive, accessible, and responsive framework for building consistent user interfaces across the MediVault application.

## Key Features

### 1. Responsive Design
- **Device Detection**: Automatic detection of phone, tablet, and desktop
- **Breakpoints**: Defined breakpoints for xs (320px), sm (375px), md (768px), lg (1024px), xl (1280px)
- **Orientation Support**: Handles both portrait and landscape modes
- **Scaling Functions**: 
  - `responsive.scale()` - Scale based on device width
  - `responsive.verticalScale()` - Scale based on device height
  - `responsive.moderateScale()` - Less aggressive scaling for better readability

### 2. Accessibility
- **WCAG 2.1 AA Compliance**: All colors meet minimum contrast ratios
- **Screen Reader Support**: Helper functions for accessibility labels, hints, and roles
- **Minimum Touch Targets**: 48x48px minimum touch target size
- **Keyboard Navigation**: Support for web-based keyboard navigation
- **Semantic Roles**: Proper ARIA roles for all interactive elements

### 3. Typography System
- **Responsive Font Sizes**: Automatically scale based on device
- **Line Heights**: Consistent line heights for readability
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Letter Spacing**: Tight, normal, and wide options

### 4. Color System
- **Primary Colors**: Blue palette (50-900 shades)
- **Semantic Colors**: Success (green), Error (red), Warning (amber), Info (blue)
- **Text Colors**: Primary, secondary, tertiary, disabled with proper contrast
- **Role-Based Colors**: Distinct colors for patient, doctor, pharmacist, lab technician, admin

### 5. Spacing System
- **Consistent Spacing**: xs (4), sm (8), md (16), lg (24), xl (32), xxl (48), xxxl (64)
- **Responsive Spacing**: Automatically adjusts based on device type
- **Container Padding**: 16px (phone), 24px (tablet), 32px (desktop)

### 6. Shadow System
- **Platform-Aware**: Different implementations for iOS (shadowColor) and Android (elevation)
- **5 Levels**: none, xs, sm, md, lg, xl
- **Consistent Depth**: Creates visual hierarchy

## Usage Examples

### Basic Component with Accessibility

```typescript
import { buttonA11yProps } from '@/utils/accessibility';
import { commonStyles } from '@/utils/responsiveStyles';
import { designSystem } from '@/config/designSystem';

<TouchableOpacity
  style={commonStyles.buttonPrimary}
  {...buttonA11yProps('Submit Form', 'Tap to submit the form')}
>
  <RNText style={commonStyles.buttonText}>Submit</RNText>
</TouchableOpacity>
```

### Responsive Card Component

```typescript
import { createResponsiveStyles } from '@/utils/responsiveStyles';
import { designSystem } from '@/config/designSystem';

const styles = createResponsiveStyles({
  card: (device) => ({
    padding: device.isTablet 
      ? designSystem.spacing.lg 
      : designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.md,
  }),
});

<View style={styles.card}>
  {/* Card content */}
</View>
```

### Accessible Input Field

```typescript
import { textInputA11yProps } from '@/utils/accessibility';

<TextInput
  style={commonStyles.input}
  {...textInputA11yProps('Email Address', 'Enter your email', true)}
  placeholder="email@example.com"
  keyboardType="email-address"
/>
```

### Grid Layout

```typescript
import { createGridLayout } from '@/utils/responsiveStyles';

const { columns, itemWidth, gap } = createGridLayout(150, 12);

<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
  {items.map(item => (
    <View key={item.id} style={{ width: itemWidth }}>
      {/* Item content */}
    </View>
  ))}
</View>
```

### Navigation with Accessibility

```typescript
import { navItemA11yProps } from '@/utils/accessibility';

<TouchableOpacity
  style={[styles.navItem, activeNav === 'dashboard' && styles.navItemActive]}
  onPress={() => setActiveNav('dashboard')}
  {...navItemA11yProps('Dashboard', activeNav === 'dashboard')}
>
  <Ionicons name="home-outline" size={24} />
  <RNText style={styles.navText}>Dashboard</RNText>
</TouchableOpacity>
```

### Responsive Typography

```typescript
import { commonStyles } from '@/utils/responsiveStyles';

<RNText style={commonStyles.heading1}>Main Heading</RNText>
<RNText style={commonStyles.heading2}>Sub Heading</RNText>
<RNText style={commonStyles.bodyRegular}>Body text</RNText>
<RNText style={commonStyles.caption}>Caption text</RNText>
```

### Alert with Screen Reader Support

```typescript
import { alertA11yProps, announceForAccessibility } from '@/utils/accessibility';

// Show alert
const showAlert = (message: string) => {
  announceForAccessibility(message);
  // Show visual alert
};

<View {...alertA11yProps('Successfully saved', true)}>
  <RNText>Successfully saved</RNText>
</View>
```

### Orientation-Aware Layout

```typescript
import { createOrientationStyles } from '@/utils/responsiveStyles';

const styles = createOrientationStyles(
  {
    // Portrait styles
    container: {
      flexDirection: 'column',
      padding: 16,
    },
  },
  {
    // Landscape overrides
    container: {
      flexDirection: 'row',
      padding: 24,
    },
  }
);
```

## Best Practices

### 1. Always Use Accessibility Props
Every interactive element should have proper accessibility labels:
```typescript
// ✅ Good
<TouchableOpacity {...buttonA11yProps('Save', 'Tap to save changes')}>

// ❌ Bad
<TouchableOpacity>
```

### 2. Use Design System Colors
Never hardcode colors:
```typescript
// ✅ Good
color: designSystem.colors.primary[600]

// ❌ Bad
color: '#2563EB'
```

### 3. Responsive Sizing
Use the design system's responsive utilities:
```typescript
// ✅ Good
fontSize: designSystem.typography.fontSize.md,
padding: designSystem.spacing.md,

// ❌ Bad
fontSize: 16,
padding: 16,
```

### 4. Platform-Specific Styles
Use Platform.select or the provided shadows:
```typescript
// ✅ Good
...designSystem.shadows.md

// ❌ Bad
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
elevation: 4,
```

### 5. Minimum Touch Targets
Ensure all touchable elements meet minimum size:
```typescript
// ✅ Good
minHeight: designSystem.accessibility.touchTarget.medium, // 48px

// ❌ Bad
height: 32,
```

### 6. Contrast Ratios
Use colors from the design system for proper contrast:
```typescript
// ✅ Good - 16.5:1 contrast ratio
color: designSystem.colors.text.primary, // #111827 on white

// ❌ Bad - Low contrast
color: '#CCCCCC', // on white background
```

### 7. Responsive Components
Always consider tablet and desktop layouts:
```typescript
// ✅ Good
const styles = createResponsiveStyles({
  card: (device) => ({
    width: device.isTablet ? '48%' : '100%',
    padding: device.isTablet ? 24 : 16,
  }),
});

// ❌ Bad - Fixed width
const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
  },
});
```

## Testing Checklist

### Accessibility Testing
- [ ] All interactive elements have accessibility labels
- [ ] Color contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] Touch targets are at least 48x48px
- [ ] Screen reader announces content correctly
- [ ] Keyboard navigation works (web)
- [ ] Focus indicators are visible

### Responsive Testing
- [ ] Test on small phone (320px width)
- [ ] Test on standard phone (375px width)
- [ ] Test on large phone (414px width)
- [ ] Test on tablet (768px width)
- [ ] Test on large tablet (1024px width)
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation

### Visual Testing
- [ ] Consistent spacing throughout
- [ ] Proper typography hierarchy
- [ ] Appropriate shadow depths
- [ ] Consistent border radius
- [ ] Proper color usage

## Migration Guide

### Updating Existing Components

1. **Import the design system:**
```typescript
import { designSystem } from '@/config/designSystem';
import { commonStyles } from '@/utils/responsiveStyles';
import { buttonA11yProps } from '@/utils/accessibility';
```

2. **Replace hardcoded values:**
```typescript
// Before
fontSize: 16,
padding: 16,
color: '#3B82F6',

// After
fontSize: designSystem.typography.fontSize.md,
padding: designSystem.spacing.md,
color: designSystem.colors.primary[500],
```

3. **Add accessibility props:**
```typescript
// Before
<TouchableOpacity onPress={handlePress}>

// After
<TouchableOpacity 
  onPress={handlePress}
  {...buttonA11yProps('Submit', 'Tap to submit form')}
>
```

4. **Make responsive:**
```typescript
// Before
const styles = StyleSheet.create({
  card: { padding: 16 },
});

// After
const styles = createResponsiveStyles({
  card: (device) => ({
    padding: device.isTablet ? 24 : 16,
  }),
});
```

## Support

For questions or issues:
1. Check this documentation
2. Review example implementations in existing components
3. Test with the design system utilities
4. Ensure accessibility requirements are met

## Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Native Accessibility**: https://reactnative.dev/docs/accessibility
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
