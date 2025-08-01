'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllModules } from '@/server/semester-modules/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/modules'}
      queryKey={['modules']}
      getData={findAllModules}
      actionIcons={[<NewLink key={'new-link'} href='/dashboard/modules/new' />]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.module!.code}
          description={it.module!.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
