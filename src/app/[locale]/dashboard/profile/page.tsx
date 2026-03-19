import ProfileForm from '@/components/features/ProfileForm';
import Navigation from '@/components/layouts/Navigation';

export default function DashboardProfilePage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-8">
            Редактировать профиль
          </h1>
          <ProfileForm />
        </div>
      </div>
    </>
  );
}
