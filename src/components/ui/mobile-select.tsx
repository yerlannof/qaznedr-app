import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface MobileSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const MobileSelect = React.forwardRef<HTMLSelectElement, MobileSelectProps>(
  (
    { className, label, error, options, placeholder = 'Select...', ...props },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            className={cn(
              // Base styles
              'touch-target w-full rounded-lg border bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-600',
              'transition-colors duration-200',
              'px-4 pr-10', // Extra padding for chevron
              'appearance-none', // Remove default arrow

              // Error state
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600',

              // Disabled state
              'disabled:cursor-not-allowed disabled:opacity-50',

              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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

MobileSelect.displayName = 'MobileSelect';

// Mobile Textarea Component
export interface MobileTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

const MobileTextarea = React.forwardRef<
  HTMLTextAreaElement,
  MobileTextareaProps
>(
  (
    {
      className,
      label,
      error,
      maxLength,
      showCount = false,
      value = '',
      ...props
    },
    ref
  ) => {
    const [count, setCount] = React.useState(String(value).length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCount(e.target.value.length);
      if (props.onChange) {
        props.onChange(e);
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
          <textarea
            className={cn(
              // Base styles
              'w-full rounded-lg border bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-600',
              'transition-colors duration-200',
              'px-4 py-3',
              'min-h-[100px] resize-y',
              'mobile-scroll', // Smooth scrolling on mobile

              // Error state
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600',

              // Disabled state
              'disabled:cursor-not-allowed disabled:opacity-50',

              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {showCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {count}/{maxLength}
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

MobileTextarea.displayName = 'MobileTextarea';

// Mobile Radio Group
export interface MobileRadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface MobileRadioGroupProps {
  name: string;
  label?: string;
  options: MobileRadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export const MobileRadioGroup: React.FC<MobileRadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors touch-target"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </div>
              {option.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

// Mobile Checkbox
export interface MobileCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const MobileCheckbox = React.forwardRef<
  HTMLInputElement,
  MobileCheckboxProps
>(({ label, description, error, className, ...props }, ref) => {
  return (
    <div className={cn('w-full', className)}>
      <label className="flex items-start gap-3 cursor-pointer touch-target">
        <input
          type="checkbox"
          ref={ref}
          className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
          {...props}
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {label}
          </div>
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </div>
          )}
        </div>
      </label>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

MobileCheckbox.displayName = 'MobileCheckbox';

export { MobileSelect, MobileTextarea };
