'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllRegistrationRequests } from '@/server/registration-requests/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/registration-requests'}
      queryKey={['registrationRequests']}
      getData={findAllRegistrationRequests}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/registration-requests/new' />,
      ]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.stdNo} description={it.student.name} />
      )}
    >
      {children}
    </ListLayout>
  );
}
