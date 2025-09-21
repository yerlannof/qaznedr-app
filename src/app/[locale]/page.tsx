'use client';

import NavigationSimple from '@/components/layouts/NavigationSimple';
import Footer from '@/components/layouts/Footer';
import PageTransition from '@/components/layouts/PageTransition';
import { GlassCard, GlassButton } from '@/components/ui/glass-card';
import {
  FadeInWhenVisible,
  StaggerChildren,
  ParallaxSection,
  FloatingElement,
  RevealText,
} from '@/components/ui/scroll-animations';
import {
  InteractiveLink,
  InteractiveButton,
} from '@/components/ui/interactive-link';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Building2,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

export default function Home() {
  const { t, locale } = useTranslation();

  return (
    <PageTransition>
      <NavigationSimple />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        {/* Hero Section with Parallax */}
        <ParallaxSection speed={0.3} className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent dark:from-blue-600/10 pointer-events-none" />
          <motion.div
            className="relative bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-950/80 backdrop-blur-sm pt-8 pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center">
                {/* Premium Title with Better Typography */}
                <FadeInWhenVisible delay={0.1}>
                  <div className="mb-6">
                    <motion.div
                      className="inline-flex items-center px-4 py-2 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 mb-4 border border-blue-200/50 dark:border-blue-800/50"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <FloatingElement amplitude={10} duration={2}>
                        <Sparkles className="w-4 h-4 mr-2" />
                      </FloatingElement>
                      {t('home.officialPlatform')}
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                      <RevealText className="block text-blue-600 dark:text-blue-400 mb-2">
                        {t('home.title').split(' ').slice(0, 2).join(' ')}
                      </RevealText>
                      <RevealText className="block text-gray-900 dark:text-gray-100">
                        {t('home.title').split(' ').slice(2).join(' ')}
                      </RevealText>
                    </h1>
                  </div>
                </FadeInWhenVisible>

                <FadeInWhenVisible delay={0.3}>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-4xl mx-auto leading-relaxed">
                    {t('home.subtitle')}
                  </p>
                </FadeInWhenVisible>

                <FadeInWhenVisible delay={0.5}>
                  <div className="flex gap-4 justify-center relative z-10">
                    <InteractiveButton
                      variant="primary"
                      size="lg"
                      onClick={() =>
                        (window.location.href = `/${locale}/listings`)
                      }
                      className="flex items-center"
                    >
                      {t('home.viewListings')}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </InteractiveButton>
                    <GlassButton
                      variant="ghost"
                      size="lg"
                      onClick={() =>
                        (window.location.href = `/${locale}/listings/create`)
                      }
                    >
                      {t('home.postListing')}
                    </GlassButton>
                  </div>
                </FadeInWhenVisible>
              </div>
            </div>
          </motion.div>
        </ParallaxSection>

        {/* Features Section with Glass Cards */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <FadeInWhenVisible>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: MapPin,
                  title: t('home.miningLicenses'),
                  desc: t('home.miningLicensesDesc'),
                },
                {
                  icon: Building2,
                  title: t('home.explorationLicenses'),
                  desc: t('home.explorationLicensesDesc'),
                },
                {
                  icon: TrendingUp,
                  title: t('home.mineralOccurrences'),
                  desc: t('home.mineralOccurrencesDesc'),
                },
              ].map((feature, index) => (
                <FadeInWhenVisible
                  key={index}
                  delay={index * 0.2}
                  direction="up"
                >
                  <GlassCard
                    variant="default"
                    blur="md"
                    hover
                    glow={index === 1}
                    className="p-6"
                  >
                    <motion.div
                      className="w-12 h-12 bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.desc}
                    </p>
                  </GlassCard>
                </FadeInWhenVisible>
              ))}
            </div>
          </FadeInWhenVisible>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('home.getStarted')}</h2>
            <p className="text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('home.getStartedDesc')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/listings`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('home.goToListings')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href={`/${locale}/services`}
                className="inline-flex items-center px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                {t('home.ourServices')}
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Section with Animated Numbers */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <FadeInWhenVisible>
            <div className="text-center mb-12">
              <RevealText className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('home.whyChooseUs')}
              </RevealText>
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: t('home.activeListings') },
              { value: '14', label: t('home.kazakhstanRegions') },
              { value: '100+', label: t('home.verifiedCompanies') },
              { value: '24/7', label: t('home.customerSupport') },
            ].map((stat, index) => (
              <FadeInWhenVisible
                key={index}
                delay={index * 0.15}
                direction="up"
              >
                <GlassCard
                  variant="secondary"
                  blur="sm"
                  hover={false}
                  className="p-6"
                >
                  <motion.div
                    className="text-3xl font-bold text-blue-600 mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      delay: 0.5 + index * 0.1,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </GlassCard>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </PageTransition>
  );
}
