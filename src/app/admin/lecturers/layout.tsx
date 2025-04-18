'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getLecturers } from '@/server/lecturers/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/lecturers'}
      queryKey={['lecturers']}
      getData={getLecturers}
      actionIcons={[<NewLink key={'new-link'} href='/admin/lecturers/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}