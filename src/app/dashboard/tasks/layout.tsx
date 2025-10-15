'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getTasks } from '@/server/tasks/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/tasks'}
      queryKey={['tasks']}
      getData={getTasks}
      actionIcons={[<NewLink key={'new-link'} href='/admin/tasks/new' />]}
      renderItem={(it) => <ListItem id={it.id} label={it.id} />}
    >
      {children}
    </ListLayout>
  );
}