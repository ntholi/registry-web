'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { registrationClearanceByDepartment } from '@/server/registration-clearance/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/registration-clearance'}
      queryKey={['registrationClearances']}
      getData={registrationClearanceByDepartment}
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/registration-clearance/new' />,
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
