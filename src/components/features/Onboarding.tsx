'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  MapPin,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ElementType;
  image?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Добро пожаловать в QAZNEDR',
    description:
      'Первая в Казахстане цифровая B2B платформа для горнодобывающей отрасли',
    icon: TrendingUp,
  },
  {
    title: 'Найдите месторождения',
    description:
      'Используйте расширенный поиск и фильтры для поиска лицензий и рудопроявлений',
    icon: Search,
  },
  {
    title: 'Интерактивная карта',
    description:
      'Просматривайте все месторождения Казахстана на интерактивной карте',
    icon: MapPin,
  },
  {
    title: 'Безопасные сделки',
    description:
      'Мы проверяем все объявления и документы для вашей безопасности',
    icon: Shield,
  },
];

export default function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) {
      setIsVisible(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
    setIsVisible(false);
  };

  if (hasSeenOnboarding || !isVisible) {
    return null;
  }

  const CurrentIcon = onboardingSteps[currentStep].icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
                <CurrentIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {onboardingSteps[currentStep].title}
              </h2>
              <p className="text-blue-100">
                {onboardingSteps[currentStep].description}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 py-4">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                      ? 'w-2 bg-blue-400'
                      : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  Начать работу
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {currentStep < onboardingSteps.length - 1 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Пропустить
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Mini tutorial tooltips
export function TutorialTooltip({
  target,
  title,
  description,
  position = 'bottom',
}: {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`tooltip_${target}`);
    if (!seen) {
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasSeenTooltip(true);
    }
  }, [target]);

  const handleDismiss = () => {
    localStorage.setItem(`tooltip_${target}`, 'true');
    setHasSeenTooltip(true);
    setIsVisible(false);
  };

  if (hasSeenTooltip || !isVisible) {
    return null;
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`absolute ${positionClasses[position]} z-50 w-64`}
      >
        <div className="bg-blue-600 text-white rounded-lg shadow-lg p-3">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold">{title}</h4>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-blue-100">{description}</p>
          <div className="absolute w-3 h-3 bg-blue-600 transform rotate-45 -bottom-1.5 left-6" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
