'use client';

import StatusPage from '@/components/StatusPage';
import { IconSearchOff } from '@tabler/icons-react';

export default function NotFound() {
  return (
    <StatusPage
      title='Page not found'
      description='The page you are looking for doesn’t exist or was moved.'
      color='gray'
      icon={<IconSearchOff size={32} />}
      primaryActionHref='/'
      primaryActionLabel='Go to dashboard'
    />
  );
}
