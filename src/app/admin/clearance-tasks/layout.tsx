'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { clearanceTaskByDepartment } from '@/server/clearance-tasks/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/clearance-tasks'}
      queryKey={['clearanceTasks']}
      getData={clearanceTaskByDepartment}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/clearance-tasks/new' />,
      ]}
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.registrationRequest.student.stdNo}
          description={it.registrationRequest.student.name}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
