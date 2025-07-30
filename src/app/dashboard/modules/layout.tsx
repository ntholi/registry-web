'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getModules } from '@/server/modules/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/modules'}
      queryKey={['modules']}
      getData={getModules}
      actionIcons={[<NewLink key={'new-link'} href='/dashboard/modules/new' />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.code} description={it.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
