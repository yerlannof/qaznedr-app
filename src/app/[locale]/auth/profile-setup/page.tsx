import ProfileTypeSelector from '@/components/features/ProfileTypeSelector';
import Navigation from '@/components/layouts/Navigation';

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Настройка профиля
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Выберите тип профиля для персонализации платформы
            </p>
          </div>
          <ProfileTypeSelector />
        </div>
      </div>
    </div>
  );
}
