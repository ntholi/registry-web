'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllModules } from '@/server/semester-modules/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/modules'}
      queryKey={['modules']}
      getData={findAllModules}
      actionIcons={[<NewLink key={'new-link'} href='/admin/modules/new' />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.code} description={it.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
