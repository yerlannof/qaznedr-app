// import { locales } from '@/i18n/config';

// Temporarily use dynamic rendering to avoid build issues  
// export async function generateStaticParams() {
//   return locales.map((locale) => ({ locale }));
// }

export default function Home() {
  return (
    <div>
      <h2>Welcome to QAZNEDR.KZ</h2>
      <p>Kazakhstan Mining Platform</p>
      <p>This is the home page with i18n enabled.</p>
    </div>
  );
}
