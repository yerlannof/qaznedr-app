'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Главная', href: '/' }
    ];

    // Path to label mapping
    const pathLabels: Record<string, string> = {
      listings: 'Объявления',
      dashboard: 'Личный кабинет',
      services: 'Услуги',
      companies: 'Компании',
      map: 'Карта',
      knowledge: 'База знаний',
      news: 'Новости',
      create: 'Создать',
      edit: 'Редактировать',
      profile: 'Профиль',
      settings: 'Настройки',
      analytics: 'Аналитика',
      messages: 'Сообщения',
      favorites: 'Избранное',
      'my-listings': 'Мои объявления',
      geological: 'Геологические услуги',
      legal: 'Юридические услуги',
      equipment: 'Оборудование',
      investors: 'Инвесторы',
    };

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;
      
      // Skip locale codes
      if (['ru', 'en', 'kz', 'zh'].includes(path)) {
        return;
      }
      
      // Handle dynamic routes (IDs)
      if (/^[a-z0-9-]+$/i.test(path) && !pathLabels[path]) {
        breadcrumbs.push({
          label: 'Детали',
          href: isLast ? undefined : currentPath,
        });
      } else {
        breadcrumbs.push({
          label: pathLabels[path] || path.charAt(0).toUpperCase() + path.slice(1),
          href: isLast ? undefined : currentPath,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav 
      aria-label="Breadcrumb"
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isFirst = index === 0;
            
            return (
              <motion.li 
                key={index}
                className="flex items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400 dark:text-gray-600" />
                )}
                
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={`
                      flex items-center gap-1.5 
                      hover:text-blue-600 dark:hover:text-blue-400 
                      transition-colors
                      ${isFirst 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {isFirst && <Home className="w-4 h-4" />}
                    <span>{crumb.label}</span>
                  </Link>
                ) : (
                  <span className={`
                    flex items-center gap-1.5
                    ${isLast 
                      ? 'text-gray-900 dark:text-gray-100 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {isFirst && <Home className="w-4 h-4" />}
                    {crumb.label}
                  </span>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

// Compact version for mobile
export function BreadcrumbsMobile() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;
  
  const pathLabels: Record<string, string> = {
    listings: 'Объявления',
    dashboard: 'Кабинет',
    services: 'Услуги',
    companies: 'Компании',
    map: 'Карта',
  };
  
  const currentPage = pathLabels[paths[paths.length - 1]] || 
                      paths[paths.length - 1].charAt(0).toUpperCase() + 
                      paths[paths.length - 1].slice(1);
  
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 lg:hidden">
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Link 
            href="/"
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
            {currentPage}
          </span>
        </div>
      </div>
    </div>
  );
}