import { useEffect } from 'react';
import {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

/**
 * Animation configurations for consistent behavior across the app
 * Optimized for performance with reduced durations
 */
export const AnimationConfig = {
  fast: { duration: 150 },
  normal: { duration: 250 },
  slow: { duration: 400 },
  spring: {
    damping: 20,
    stiffness: 180,
    mass: 0.3,
  },
  springBouncy: {
    damping: 12,
    stiffness: 120,
    mass: 0.8,
  },
};

/**
 * Fade In Animation Hook
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms)
 */
export const useFadeIn = (delay = 0, duration = 300) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Slide In From Bottom Animation Hook
 * @param delay - Delay before animation starts (ms)
 * @param distance - Distance to slide from (default: 50)
 */
export const useSlideInBottom = (delay = 0, distance = 50) => {
  const translateY = useSharedValue(distance);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Slide In From Top Animation Hook
 * @param delay - Delay before animation starts (ms)
 * @param distance - Distance to slide from (default: -50)
 */
export const useSlideInTop = (delay = 0, distance = -50) => {
  const translateY = useSharedValue(distance);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Slide In From Left Animation Hook
 * @param delay - Delay before animation starts (ms)
 * @param distance - Distance to slide from (default: -50)
 */
export const useSlideInLeft = (delay = 0, distance = -50) => {
  const translateX = useSharedValue(distance);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Slide In From Right Animation Hook
 * @param delay - Delay before animation starts (ms)
 * @param distance - Distance to slide from (default: 50)
 */
export const useSlideInRight = (delay = 0, distance = 50) => {
  const translateX = useSharedValue(distance);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Scale In Animation Hook
 * @param delay - Delay before animation starts (ms)
 */
export const useScaleIn = (delay = 0) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Bounce In Animation Hook
 * @param delay - Delay before animation starts (ms)
 */
export const useBounceIn = (delay = 0) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, AnimationConfig.springBouncy)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

/**
 * Stagger Children Animation Hook - OPTIMIZED
 * Reduced complexity for better performance
 * @param index - Index of the child element
 * @param staggerDelay - Delay between each child (ms) - default reduced to 50ms
 */
export const useStaggerAnimation = (index: number, staggerDelay = 50) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20); // Reduced distance

  useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 200 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};

/**
 * Press Animation Hook for buttons
 */
export const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, AnimationConfig.spring);
  };

  return { animatedStyle, onPressIn, onPressOut };
};

/**
 * Shake Animation Hook (for errors)
 */
export const useShake = () => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  return { animatedStyle, shake };
};

/**
 * Rotate Animation Hook
 * @param delay - Delay before animation starts (ms)
 */
export const useRotateIn = (delay = 0) => {
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    rotate.value = withDelay(delay, withSpring(1, AnimationConfig.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          rotate.value,
          [0, 1],
          [180, 0],
          Extrapolate.CLAMP
        )}deg`,
      },
    ],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Page Transition Animation Hook
 */
export const usePageTransition = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, AnimationConfig.spring);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};

/**
 * Card Flip Animation Hook
 */
export const useFlipCard = () => {
  const rotateY = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value + 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const flip = () => {
    rotateY.value = withSpring(rotateY.value === 0 ? 180 : 0, {
      damping: 15,
      stiffness: 100,
    });
  };

  return { frontAnimatedStyle, backAnimatedStyle, flip };
};

/**
 * Progress Bar Animation Hook
 * @param progress - Progress value (0-100)
 */
export const useProgressBar = (progress: number) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(progress, AnimationConfig.spring);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return animatedStyle;
};

/**
 * Pulse Animation Hook (for notifications) - OPTIMIZED
 * Faster and more subtle for better performance
 */
export const usePulse = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 300 }), // Reduced scale and duration
      withTiming(1, { duration: 300 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

/**
 * Scroll Triggered Animation Hook
 * Triggers animation when element is visible on scroll
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms)
 */
/**
 * Scroll Triggered Animation Hook - OPTIMIZED
 * Removed scale transform for better performance
 * @param delay - Delay before animation starts (ms)
 * @param duration - Animation duration (ms) - default reduced to 400ms
 */
export const useScrollTrigger = (delay = 0, duration = 400) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30); // Reduced distance

  const trigger = () => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withSpring(0, AnimationConfig.spring));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { animatedStyle, trigger };
};
