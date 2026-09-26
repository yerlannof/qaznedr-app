'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { translate } from '@/lib/i18n/translations';
import styles from './GeologyScene.module.css';

const DESKTOP = '(min-width: 1024px) and (min-height: 740px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const HEADER = 64;
const STAGE_KEY = 'qaznedr-geology-stage';
const STEPS = [1, 2, 3] as const;
type Mode = 'static' | 'manual' | 'scroll';

export default function GeologyScene({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  const root = useRef<HTMLElement>(null);
  // SSR/no-JS presents all explanations and expanded artwork. Motion is opt-in
  // after hydration and respects both the viewport and system preference.
  const [mode, setMode] = useState<Mode>('static');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STAGE_KEY);
      if (saved !== null && /^[0-2]$/.test(saved)) setStage(Number(saved));
    } catch {
      // Storage may be unavailable in embedded/private browsers.
    }
    const desktop = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED);
    const update = () =>
      setMode(
        reduced.matches ? 'static' : desktop.matches ? 'scroll' : 'manual'
      );
    update();
    desktop.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (mode === 'static') return;
    try {
      window.sessionStorage.setItem(STAGE_KEY, String(stage));
    } catch {
      // Persistence is optional; controls and scrolling remain usable.
    }
  }, [mode, stage]);

  useEffect(() => {
    if (mode !== 'scroll') return;
    let frame = 0;
    let lastProgress = -1;
    const section = root.current;
    const update = () => {
      frame = 0;
      const rect = section?.getBoundingClientRect();
      if (!rect || !section) return;
      const travel = rect.height - (window.innerHeight - HEADER);
      if (travel <= 0) return;
      const progress = Math.max(0, Math.min(1, (HEADER - rect.top) / travel));
      if (progress === lastProgress) return;
      lastProgress = progress;
      // Write only compositor inputs per frame, not React state for every pixel.
      section.style.setProperty('--reveal', String(Math.min(1, progress * 2)));
      section.style.setProperty(
        '--focus',
        String(Math.max(0, progress * 2 - 1))
      );
      setStage(Math.round(progress * 2));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      section?.style.removeProperty('--reveal');
      section?.style.removeProperty('--focus');
    };
  }, [mode]);

  function select(index: number) {
    if (mode !== 'scroll' || !root.current) {
      setStage(index);
      return;
    }
    const rect = root.current.getBoundingClientRect();
    const travel = rect.height - (window.innerHeight - HEADER);
    // Selection and pose follow actual scroll, including smooth button travel.
    window.scrollTo({
      top: window.scrollY + rect.top - HEADER + (index / 2) * travel,
      behavior: 'smooth',
    });
  }

  return (
    <section
      ref={root}
      className={styles.root}
      aria-labelledby="home-geology"
      data-mode={mode}
      data-stage={mode === 'static' ? 1 : stage}
    >
      <div className={styles.scene}>
        <div className={styles.copy}>
          <h2 id="home-geology" className={styles.heading}>
            {t('portal.trust.archiveTitle')}
          </h2>
          <p className={styles.intro}>{t('portal.trust.archiveDesc')}</p>
          <div className={styles.explanations}>
            {STEPS.map((step, index) => (
              <div key={step} hidden={mode !== 'static' && stage !== index}>
                <p className={styles.eyebrow}>0{step} / 03</p>
                <h3 className={styles.title}>
                  {t(`geologyScene.stage${step}Title`)}
                </h3>
                <p className={styles.description}>
                  {t(`geologyScene.stage${step}Body`)}
                </p>
                <p className={styles.question}>
                  {t(`geologyScene.stage${step}Question`)}
                </p>
              </div>
            ))}
          </div>
          {mode !== 'static' && (
            <div className={styles.controls}>
              {STEPS.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  aria-pressed={stage === index}
                  onClick={() => select(index)}
                >
                  0{step} · {t(`geologyScene.stage${step}Label`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.artboard}>
          <div className={styles.art} aria-hidden="true">
            {['surface', 'middle', 'base'].map((layer) => (
              <div key={layer} className={`${styles.layer} ${styles[layer]}`}>
                <Image
                  src="/brand/geology-layers.png"
                  alt=""
                  width={1254}
                  height={1254}
                  sizes="(max-width:767px) 92vw, (max-width:1023px) 650px, 660px"
                  className={styles.image}
                />
              </div>
            ))}
            <span className={`${styles.label} ${styles.surfaceLabel}`}>
              {t('geologyScene.surface')}
            </span>
            <span className={`${styles.label} ${styles.contactLabel}`}>
              {t('geologyScene.contacts')}
            </span>
            <span className={`${styles.label} ${styles.baseLabel}`}>
              {t('geologyScene.base')}
            </span>
            <span className={styles.focus} />
          </div>
          <p className={styles.disclaimer}>{t('geologyScene.disclaimer')}</p>
        </div>
      </div>
    </section>
  );
}
