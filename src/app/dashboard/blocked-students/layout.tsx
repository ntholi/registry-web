'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getBlockedStudentByStatus } from '@/server/blocked-students/actions';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/blocked-students'}
      queryKey={['blocked-students']}
      getData={async () => await getBlockedStudentByStatus('blocked')}
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
