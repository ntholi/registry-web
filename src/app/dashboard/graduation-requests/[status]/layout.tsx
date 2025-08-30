'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getGraduationRequests } from '@/server/graduation-requests/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/graduation-requests'}
      queryKey={['graduation-requests']}
      getData={getGraduationRequests}
      actionIcons={[<NewLink key={'new-link'} href='/admin/graduation-requests/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}