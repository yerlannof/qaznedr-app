'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { translate } from '@/lib/i18n/translations';
import styles from './GeologyScene.module.css';

const REDUCED = '(prefers-reduced-motion: reduce)';
const SHORT = '(max-height: 640px)';
const STEPS = [1, 2, 3] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
type Mode = 'static' | 'scroll';

export default function GeologyScene({ locale }: { locale: string }) {
  const t = (key: string) => translate(locale, key);
  const root = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  // SSR/no-JS presents all explanations and expanded artwork. Motion is opt-in
  // after hydration and respects both the viewport and system preference.
  const [mode, setMode] = useState<Mode>('static');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(REDUCED);
    const short = window.matchMedia(SHORT);
    const update = () =>
      setMode(reduced.matches || short.matches ? 'static' : 'scroll');
    update();
    short.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      short.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'scroll') return;
    let frame = 0;
    const section = root.current;
    const update = () => {
      frame = 0;
      if (!section || stepRefs.current.some((step) => !step)) return;
      const line =
        window.innerHeight * (window.innerHeight < 700 ? 0.62 : 0.55);
      const centers = stepRefs.current.map((step) => {
        const rect = step!.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const [first, second, third] = centers;
      const lift = clamp((line - first) / Math.max(1, second - first));
      const drop = clamp((line - second) / Math.max(1, third - second));
      section.style.setProperty('--lift', String(lift));
      section.style.setProperty('--drop', String(drop));
      section.style.setProperty('--focus', String(clamp((drop - 0.35) / 0.55)));
      const nearest = centers.reduce(
        (best, center, index) =>
          Math.abs(center - line) < Math.abs(centers[best] - line)
            ? index
            : best,
        0
      );
      setStage(nearest);
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
      section?.style.removeProperty('--lift');
      section?.style.removeProperty('--drop');
      section?.style.removeProperty('--focus');
    };
  }, [mode]);

  function select(index: number) {
    // CSS scroll-margin-top clears the fixed header and mobile sticky artwork.
    stepRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <div className={styles.wrapper}>
      <section
        ref={root}
        className={styles.root}
        aria-labelledby="home-geology"
        data-mode={mode}
        data-stage={stage}
      >
        <div className={styles.scene}>
          <div className={styles.header}>
            <p className={styles.kicker}>{t('geologyScene.section')}</p>
            <h2 id="home-geology" className={styles.heading}>
              {t('portal.trust.archiveTitle')}
            </h2>
            <p className={styles.intro}>{t('portal.trust.archiveDesc')}</p>
          </div>
          <div className={styles.body}>
            <div
              className={styles.artboard}
              role="img"
              aria-label={t('geologyScene.disclaimer')}
            >
              <div className={styles.art} aria-hidden="true">
                {(['surface', 'middle', 'base'] as const).map((layer) => (
                  <div
                    key={layer}
                    className={`${styles.layer} ${styles[layer]}`}
                  >
                    <Image
                      src="/brand/geology-realistic.png"
                      alt=""
                      width={1254}
                      height={1254}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 600px, 740px"
                      className={styles.image}
                    />
                    <span
                      className={`${styles.label} ${styles[`${layer}Label`]}`}
                    >
                      {t(
                        `geologyScene.${layer === 'middle' ? 'contacts' : layer}`
                      )}
                    </span>
                    {layer === 'middle' && (
                      <svg
                        className={styles.leader}
                        viewBox="0 0 1000 1000"
                        focusable="false"
                      >
                        <path d="M 740 365 H 710 L 500 545" />
                        <circle cx="500" cy="545" r="15" />
                        <circle
                          className={styles.pin}
                          cx="500"
                          cy="545"
                          r="3"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.copy}>
              <div className={styles.explanations}>
                {STEPS.map((step, index) => (
                  <article
                    key={step}
                    ref={(element) => {
                      stepRefs.current[index] = element;
                    }}
                    className={styles.step}
                    data-step={index}
                  >
                    <p className={styles.eyebrow}>
                      0{step} / 03 · {t(`geologyScene.stage${step}Label`)}
                    </p>
                    <h3 className={styles.title}>
                      {t(`geologyScene.stage${step}Title`)}
                    </h3>
                    <p className={styles.description}>
                      {t(`geologyScene.stage${step}Body`)}
                    </p>
                    <p className={styles.question}>
                      {t(`geologyScene.stage${step}Question`)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          {mode === 'scroll' && (
            <div
              className={styles.controls}
              role="group"
              aria-label={t('geologyScene.controlsLabel')}
            >
              <div className={styles.buttons}>
                {STEPS.map((step, index) => (
                  <button
                    key={step}
                    type="button"
                    aria-pressed={stage === index}
                    onClick={() => select(index)}
                  >
                    0{step} / {t(`geologyScene.stage${step}Label`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <div className={styles.footnote}>
        <div>
          <p className={styles.disclaimer}>{t('geologyScene.disclaimer')}</p>
          <p className={styles.note}>{t('geologyScene.note')}</p>
        </div>
        {mode !== 'static' && (
          <p className={styles.hint}>{t('geologyScene.hint')}</p>
        )}
      </div>
    </div>
  );
}
