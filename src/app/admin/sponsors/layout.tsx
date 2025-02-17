'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllSponsors } from '@/server/sponsors/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/sponsors'}
      queryKey={['sponsors']}
      getData={findAllSponsors}
      actionIcons={[<NewLink key={'new-link'} href='/admin/sponsors/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.name} />}
    >
      {children}
    </ListLayout>
  );
}
