import { useState, useEffect } from 'react';

export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkDevice = () => {
      // Check viewport width
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      setIsMobile(width < breakpoint);

      // Check touch capability
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouch(hasTouch);
    };

    // Initial check
    checkDevice();

    // Listen for resize events with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkDevice, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkDevice);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return {
    isMobile,
    isTouch,
    viewport,
    isSmallMobile: viewport.width < 375,
    isMediumMobile: viewport.width >= 375 && viewport.width < 425,
    isLargeMobile: viewport.width >= 425 && viewport.width < 768,
    isTablet: viewport.width >= 768 && viewport.width < 1024,
    isDesktop: viewport.width >= 1024,
    isLandscape: viewport.width > viewport.height,
    isPortrait: viewport.height > viewport.width,
  };
}

// Hook for detecting iOS devices and safe areas
export function useIOSSafeArea() {
  const [isIOS, setIsIOS] = useState(false);
  const [hasNotch, setHasNotch] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    // Detect iOS
    const isIOSDevice =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check for notch (iPhone X and later)
    const hasNotchDevice =
      isIOSDevice &&
      // iPhone X, XS, 11 Pro
      ((window.screen.width === 375 && window.screen.height === 812) ||
        // iPhone XR, XS Max, 11, 11 Pro Max
        (window.screen.width === 414 && window.screen.height === 896) ||
        // iPhone 12, 13, 14 (standard and Pro)
        (window.screen.width === 390 && window.screen.height === 844) ||
        // iPhone 12, 13, 14 Pro Max
        (window.screen.width === 428 && window.screen.height === 926) ||
        // iPhone 14 Pro, 15 Pro
        (window.screen.width === 393 && window.screen.height === 852) ||
        // iPhone 14 Pro Max, 15 Pro Max
        (window.screen.width === 430 && window.screen.height === 932));
    setHasNotch(hasNotchDevice);

    // Get safe area insets from CSS env variables
    const computedStyle = getComputedStyle(document.documentElement);
    const top = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'
    );
    const bottom = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'
    );
    const left = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'
    );
    const right = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'
    );

    setSafeAreaInsets({ top, bottom, left, right });
  }, []);

  return {
    isIOS,
    hasNotch,
    safeAreaInsets,
  };
}

// Hook for handling mobile keyboard
export function useMobileKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleFocusIn = () => {
      setIsKeyboardVisible(true);

      // Estimate keyboard height
      setTimeout(() => {
        const viewportHeight =
          window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const height = windowHeight - viewportHeight;
        setKeyboardHeight(Math.max(0, height));
      }, 300);
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    // Visual Viewport API for better keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardVisible = windowHeight - viewportHeight > 100;

        setIsKeyboardVisible(keyboardVisible);
        setKeyboardHeight(keyboardVisible ? windowHeight - viewportHeight : 0);
      });
    }

    // Fallback to focus events
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
  };
}
