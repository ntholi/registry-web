'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { getNotifications, type Notification } from './actions/notifications';

export default function Notifications() {
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  const visibleNotifications = notifications.filter(
    (notification) => !closedIds.has(notification.id),
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <section aria-label='Notifications' className='space-y-4 px-0.5 pb-4'>
      <div className='flex items-center gap-3 px-1'>
        <div className='relative'>
          <Bell className='h-5 w-5 text-muted-foreground' />
          <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
            {visibleNotifications.length}
          </span>
        </div>
        <h2 className='text-lg font-semibold tracking-tight'>Notifications</h2>
      </div>

      <div className='grid gap-4' role='feed' aria-busy='false'>
        {visibleNotifications.map((notification, index) => (
          <NotificationCard
            key={notification.id}
            {...notification}
            onClose={() =>
              setClosedIds((prev) => new Set([...prev, notification.id]))
            }
            aria-posinset={index + 1}
            aria-setsize={visibleNotifications.length}
          />
        ))}
      </div>
    </section>
  );
}

const notificationConfig = {
  pending: {
    className: 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    icon: TriangleAlert,
  },
  partial: {
    className: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: Info,
  },
  approved: {
    className: 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    icon: CircleCheck,
  },
  registered: {
    className: 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    icon: CircleCheck,
  },
  rejected: {
    className: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/50',
    textColor: 'text-red-600 dark:text-red-400',
    icon: CircleAlert,
  },
};

function NotificationCard({
  title,
  message,
  status,
  href,
  className,
  onClose,
  ...props
}: Notification &
  React.HTMLAttributes<HTMLAnchorElement> & { onClose?: () => void }) {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose?.();
  };

  const config = notificationConfig[status];
  const Icon = config.icon;

  return (
    <Link
      href={href}
      role='article'
      tabIndex={0}
      className={cn(
        'group relative block rounded-lg border p-4 no-underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors hover:bg-accent/50',
        config.className,
        className,
      )}
      {...props}
    >
      <div className='flex items-start gap-4'>
        <Icon
          className={cn('mt-1 h-5 w-5 flex-shrink-0', config.textColor)}
          strokeWidth={2}
          aria-hidden='true'
        />
        <div className='flex-1 space-y-2'>
          <div className='flex items-center justify-between gap-4'>
            <h3 className='font-medium'>{title}</h3>
          </div>
          {message && (
            <p className='text-xs text-muted-foreground'>{message}</p>
          )}
        </div>
      </div>
      {onClose && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handleClose}
          className='absolute right-2 top-2 rounded-full ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-hover:opacity-70 sm:opacity-0'
          aria-label='Close notification'
        >
          <X className='h-4 w-4' />
        </Button>
      )}
    </Link>
  );
}
