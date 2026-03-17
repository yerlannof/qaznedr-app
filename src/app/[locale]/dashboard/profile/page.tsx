import ProfileForm from '@/components/features/ProfileForm';
import NavigationSimple from '@/components/layouts/NavigationSimple';

export default function DashboardProfilePage() {
  return (
    <>
      <NavigationSimple />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <ProfileForm />
        </div>
      </div>
    </>
  );
}
