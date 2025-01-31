'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllClearanceResponses } from '@/server/clearance-responses/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/clearance-responses'}
      queryKey={['clearanceResponses']}
      getData={findAllClearanceResponses}
      actionIcons={[<NewLink key={'new-link'} href='/admin/clearance-responses/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}