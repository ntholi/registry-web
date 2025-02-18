'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { registrationClearanceByDepartment } from '@/server/registration-clearance/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/admin/registration-clearance'}
      queryKey={['registrationClearances']}
      getData={(page, search) =>
        registrationClearanceByDepartment(page, search)
      }
      renderItem={(it) => (
        <ListItem
          id={it.id}
          label={it.registrationRequest.student.stdNo}
          description={it.registrationRequest.student.name}
          rightSection={getStatusIcon(
            it.status as 'pending' | 'approved' | 'rejected',
          )}
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
      return <IconClock size={'1rem'} color='orange' />;
    case 'approved':
      return <IconCheck size={'1rem'} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={'1rem'} color='red' />;
  }
}
