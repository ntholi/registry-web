'use client';

import { cn, formatDate } from '@/lib/utils';
import { getNotifications, type Notification } from './actions/notifications';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function Notifications() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  if (notifications.length === 0) {
    return null;
  }

  return (
    <section aria-label='Notifications' className='space-y-4 pb-4 px-0.5'>
      <div className='flex items-center gap-3 px-1'>
        <div className='relative'>
          <Bell className='h-5 w-5 text-muted-foreground' />
          <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
            {notifications.length}
          </span>
        </div>
        <h2 className='text-lg font-semibold tracking-tight'>Notifications</h2>
      </div>

      <div className='grid gap-4' role='feed' aria-busy='false'>
        {notifications.map((notification, index) => (
          <NotificationCard
            key={notification.id}
            {...notification}
            aria-posinset={index + 1}
            aria-setsize={notifications.length}
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
  approved: {
    className: 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    icon: CircleCheck,
  },
  rejected: {
    className: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/50',
    textColor: 'text-red-600 dark:text-red-400',
    icon: CircleAlert,
  },
  info: {
    className: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: Info,
  },
};

function NotificationCard({
  title,
  message,
  status,
  timestamp,
  href,
  className,
  ...props
}: Notification & React.HTMLAttributes<HTMLAnchorElement>) {
  const config = notificationConfig[status];
  const Icon = config.icon;

  return (
    <Link
      href={href}
      role='article'
      tabIndex={0}
      className={cn(
        'group relative rounded-lg border p-4 block no-underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'hover:bg-accent/50 transition-colors',
        config.className,
        className
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
            <time
              dateTime={timestamp.toISOString()}
              className='text-xs text-muted-foreground'
            >
              {formatDate(timestamp)}
            </time>
          </div>
          {message && (
            <p className='text-xs text-muted-foreground'>{message}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
