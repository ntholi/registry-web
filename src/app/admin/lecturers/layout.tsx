'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { getLecturers } from '@/server/lecturers/actions';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/lecturers'}
      queryKey={['lecturers']}
      getData={getLecturers}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}
