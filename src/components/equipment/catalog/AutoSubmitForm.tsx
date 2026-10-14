'use client';

import type { ReactNode } from 'react';

/** A plain GET form that also submits itself when a filter changes (works without JS too). */
export default function AutoSubmitForm({
  action,
  children,
  className,
}: {
  action: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      method="get"
      action={action}
      className={className}
      onChange={(event) => event.currentTarget.requestSubmit()}
    >
      {children}
    </form>
  );
}
