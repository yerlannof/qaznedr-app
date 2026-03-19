'use client';

import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import PageTransition from '@/components/layouts/PageTransition';
import { GlassCard, GlassButton } from '@/components/ui/glass-card';
import {
  FadeInWhenVisible,
  StaggerChildren,
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
  UserPlus,
  FileText,
  Handshake,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Home() {
  const { t, locale } = useTranslation();
  const [listingsCount, setListingsCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/listings?limit=1')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.pagination?.total) {
          setListingsCount(json.data.pagination.total);
        }
      })
      .catch(() => {
        // silently fail, will show fallback
      });
  }, []);

  return (
    <PageTransition>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent dark:from-blue-600/10 pointer-events-none" />
          <div className="relative bg-gradient-to-b from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-950/80 backdrop-blur-sm pt-8 pb-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center">
                {/* Premium Title with Better Typography */}
                <FadeInWhenVisible delay={0.1}>
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 mb-4 border border-blue-200/50 dark:border-blue-800/50 transition-all hover:shadow-md">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('home.officialPlatform')}
                    </div>
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
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <FadeInWhenVisible>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {locale === 'en'
                  ? 'How It Works'
                  : locale === 'kz'
                    ? 'Қалай жұмыс істейді'
                    : locale === 'zh'
                      ? '如何运作'
                      : 'Как это работает'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {locale === 'en'
                  ? 'Start working with the platform in three simple steps'
                  : locale === 'kz'
                    ? 'Үш қарапайым қадаммен платформамен жұмыс істеңіз'
                    : locale === 'zh'
                      ? '通过三个简单步骤开始使用平台'
                      : 'Начните работу с платформой за три простых шага'}
              </p>
            </div>
          </FadeInWhenVisible>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: UserPlus,
                step: '01',
                title:
                  locale === 'en'
                    ? 'Register'
                    : locale === 'kz'
                      ? 'Тіркеліңіз'
                      : locale === 'zh'
                        ? '注册'
                        : 'Зарегистрируйтесь',
                desc:
                  locale === 'en'
                    ? 'Create an account and set up your company profile'
                    : locale === 'kz'
                      ? 'Аккаунт жасаңыз және компания профилін баптаңыз'
                      : locale === 'zh'
                        ? '创建账户并设置公司资料'
                        : 'Создайте аккаунт и настройте профиль компании',
              },
              {
                icon: FileText,
                step: '02',
                title:
                  locale === 'en'
                    ? 'Post a Listing'
                    : locale === 'kz'
                      ? 'Хабарландыру жариялаңыз'
                      : locale === 'zh'
                        ? '发布信息'
                        : 'Разместите объявление',
                desc:
                  locale === 'en'
                    ? 'Publish your deposit, license, or service listing'
                    : locale === 'kz'
                      ? 'Кен орнын, лицензияны немесе қызметті жариялаңыз'
                      : locale === 'zh'
                        ? '发布您的矿床、许可证或服务信息'
                        : 'Опубликуйте месторождение, лицензию или услугу',
              },
              {
                icon: Handshake,
                step: '03',
                title:
                  locale === 'en'
                    ? 'Find a Partner'
                    : locale === 'kz'
                      ? 'Серіктес табыңыз'
                      : locale === 'zh'
                        ? '寻找合作伙伴'
                        : 'Найдите партнёра',
                desc:
                  locale === 'en'
                    ? 'Connect with buyers, sellers, and service providers'
                    : locale === 'kz'
                      ? 'Сатып алушылармен, сатушылармен және қызмет көрсетушілермен байланысыңыз'
                      : locale === 'zh'
                        ? '与买家、卖家和服务商建立联系'
                        : 'Свяжитесь с покупателями, продавцами и поставщиками услуг',
              },
            ].map((item, index) => (
              <FadeInWhenVisible key={index} delay={index * 0.2} direction="up">
                <div className="relative text-center p-6">
                  <div className="text-5xl font-bold text-blue-100 dark:text-blue-900/40 absolute top-2 right-4 select-none">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-200/50 dark:border-blue-800/50">
                    <item.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {item.desc}
                  </p>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>

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
              {
                value: listingsCount !== null ? String(listingsCount) : '...',
                label: t('home.activeListings'),
              },
              { value: '14', label: t('home.kazakhstanRegions') },
              { value: '10+', label: t('home.verifiedCompanies') },
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
