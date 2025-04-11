'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getLecturesModules } from '@/server/lecturer-modules/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/lecturer-modules'}
      queryKey={['lecturerModules ']}
      getData={getLecturesModules}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/lecturer-modules/new' />,
      ]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.module.code}
          description={it.module.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
