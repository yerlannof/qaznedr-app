'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  root?: Element | null;
  fallbackInView?: boolean;
}

interface UseInViewResult {
  ref: React.RefObject<HTMLElement | null>;
  inView: boolean;
  entry?: IntersectionObserverEntry;
}

export function useInView(options: UseInViewOptions = {}): UseInViewResult {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    triggerOnce = false,
    root = null,
    fallbackInView = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = triggerOnce && inView;

  const callback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [observerEntry] = entries;

      if (!frozen) {
        setInView(observerEntry.isIntersecting);
        setEntry(observerEntry);
      }
    },
    [frozen]
  );

  useEffect(() => {
    const element = ref.current;

    // Fallback for environments without IntersectionObserver
    if (!element || !('IntersectionObserver' in window)) {
      if (fallbackInView) {
        setInView(true);
      }
      return;
    }

    if (frozen) return;

    const observer = new IntersectionObserver(callback, {
      threshold,
      rootMargin,
      root,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, threshold, rootMargin, root, frozen, fallbackInView]);

  return {
    ref,
    inView,
    entry,
  };
}

// Hook для lazy loading изображений
export function useLazyImage(src: string, options: UseInViewOptions = {}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px',
    ...options,
  });

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>();

  useEffect(() => {
    if (inView && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [inView, src, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  return {
    ref,
    src: imageSrc,
    loaded,
    error,
    inView,
  };
}

// Hook для отложенной загрузки компонентов
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: UseInViewOptions = {}
) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px',
    ...options,
  });

  const [Component, setComponent] = useState<React.ComponentType<T> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (inView && !Component && !loading) {
      setLoading(true);
      importFn()
        .then((module) => {
          setComponent(() => module.default);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }
  }, [inView, Component, loading, importFn]);

  return {
    ref,
    Component,
    loading,
    error,
    inView,
  };
}

// Hook для infinity scroll
export function useInfiniteScroll(
  callback: () => void,
  options: UseInViewOptions = {}
) {
  const { ref, inView } = useInView({
    threshold: 1.0,
    rootMargin: '100px',
    ...options,
  });

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (inView) {
      callbackRef.current();
    }
  }, [inView]);

  return { ref, inView };
}

// Hook для отслеживания видимости элементов (аналитика)
export function useViewTracking(
  eventName: string,
  metadata?: Record<string, any>,
  options: UseInViewOptions = {}
) {
  const { ref, inView, entry } = useInView({
    threshold: 0.5,
    triggerOnce: true,
    ...options,
  });

  useEffect(() => {
    if (inView && entry) {
      // Отправляем событие в аналитику
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'view_item', {
          event_category: 'Element Tracking',
          event_label: eventName,
          custom_parameter_1: metadata,
        });
      }

      // Vercel Analytics
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', eventName, metadata);
      }

      console.log(`[View Tracking] ${eventName}`, metadata);
    }
  }, [inView, entry, eventName, metadata]);

  return { ref, inView };
}

export default useInView;
