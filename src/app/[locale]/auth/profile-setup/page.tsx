import ProfileTypeSelector from '@/components/features/ProfileTypeSelector';
import Navigation from '@/components/layouts/Navigation';

export default function ProfileSetupPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
        <ProfileTypeSelector />
      </div>
    </>
  );
}
