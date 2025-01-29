'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllSignups } from '@/server/signups/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/signups'}
      queryKey={['signups']}
      getData={findAllSignups}
      actionIcons={[<NewLink key={'new-link'} href='/admin/signups/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}