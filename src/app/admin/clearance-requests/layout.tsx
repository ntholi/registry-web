'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllClearanceRequests } from '@/server/clearance-requests/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/clearance-requests'}
      queryKey={['clearanceRequests']}
      getData={findAllClearanceRequests}
      actionIcons={[<NewLink key={'new-link'} href='/admin/clearance-requests/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}