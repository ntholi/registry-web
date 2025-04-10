'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getLecturesModules } from '@/server/lectures-modules/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/lectures-modules'}
      queryKey={['lecturesModules']}
      getData={getLecturesModules}
      actionIcons={[<NewLink key={'new-link'} href='/admin/lectures-modules/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}