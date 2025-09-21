import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type = 'text', label, error, icon, suffix, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    // Set appropriate input mode based on type
    const getInputMode = () => {
      switch (type) {
        case 'tel':
          return 'tel';
        case 'email':
          return 'email';
        case 'url':
          return 'url';
        case 'number':
          return 'numeric';
        case 'search':
          return 'search';
        default:
          return 'text';
      }
    };

    // Set appropriate autocomplete
    const getAutoComplete = () => {
      switch (type) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'password':
          return 'current-password';
        case 'new-password':
          return 'new-password';
        default:
          return props.autoComplete || 'off';
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              // Base styles
              'touch-target w-full rounded-lg border bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-600',
              'transition-colors duration-200',

              // Padding adjustments for icon/suffix
              icon ? 'pl-10' : 'px-4',
              suffix ? 'pr-10' : 'px-4',

              // Error state
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600',

              // Disabled state
              'disabled:cursor-not-allowed disabled:opacity-50',

              className
            )}
            ref={ref}
            inputMode={getInputMode()}
            autoComplete={getAutoComplete()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Specialized mobile-optimized inputs
export const MobilePhoneInput = React.forwardRef<
  HTMLInputElement,
  Omit<MobileInputProps, 'type' | 'inputMode'>
>((props, ref) => (
  <MobileInput
    ref={ref}
    type="tel"
    autoComplete="tel"
    pattern="[0-9]{10,}"
    {...props}
  />
));

MobilePhoneInput.displayName = 'MobilePhoneInput';

export const MobileEmailInput = React.forwardRef<
  HTMLInputElement,
  Omit<MobileInputProps, 'type' | 'inputMode'>
>((props, ref) => (
  <MobileInput
    ref={ref}
    type="email"
    autoComplete="email"
    autoCapitalize="off"
    autoCorrect="off"
    {...props}
  />
));

MobileEmailInput.displayName = 'MobileEmailInput';

export const MobileNumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<MobileInputProps, 'type' | 'inputMode'>
>((props, ref) => (
  <MobileInput ref={ref} type="number" pattern="[0-9]*" {...props} />
));

MobileNumberInput.displayName = 'MobileNumberInput';

export const MobileSearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<MobileInputProps, 'type' | 'inputMode'>
>((props, ref) => (
  <MobileInput
    ref={ref}
    type="search"
    autoCorrect="off"
    autoCapitalize="off"
    {...props}
  />
));

MobileSearchInput.displayName = 'MobileSearchInput';

export { MobileInput };
