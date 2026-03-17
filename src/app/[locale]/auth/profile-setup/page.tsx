import ProfileTypeSelector from '@/components/features/ProfileTypeSelector';
import NavigationSimple from '@/components/layouts/NavigationSimple';

export default function ProfileSetupPage() {
  return (
    <>
      <NavigationSimple />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
        <ProfileTypeSelector />
      </div>
    </>
  );
}
