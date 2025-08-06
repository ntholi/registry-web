'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getBlockedStudents } from '@/server/blocked-students/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/blocked-students'}
      queryKey={['blocked-students']}
      getData={getBlockedStudents}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/blocked-students/new' />,
      ]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.stdNo} description={it.student.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
