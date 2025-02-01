'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { registrationClearanceByDepartment } from '@/server/registration-clearance/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';

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
          rightSection={getStatusIcon(it.status)}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}

function getStatusIcon(status: 'pending' | 'approved' | 'rejected') {
  switch (status) {
    case 'pending':
      return <IconClock size={18} color='yellow' />;
    case 'approved':
      return <IconCheck size={18} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={18} color='red' />;
  }
}
