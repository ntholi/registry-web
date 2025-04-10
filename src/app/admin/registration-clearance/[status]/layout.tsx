'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { registrationClearanceByStatus } from '@/server/registration-clearance/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { useParams } from 'next/navigation';

type Status = 'pending' | 'approved' | 'rejected';

const statusTitles = {
  pending: 'Pending Clearance Requests',
  approved: 'Approved Clearances',
  rejected: 'Rejected Clearances',
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/admin/registration-clearance/' + status}
      queryKey={['registrationClearances', status]}
      getData={async (page, search) => {
        const response = await registrationClearanceByStatus(
          status,
          page,
          search,
        );
        return {
          items: response.items || [],
          totalPages: response.totalPages || 1,
        };
      }}
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
      return <IconClock size={'1rem'} color='orange' />;
    case 'approved':
      return <IconCheck size={'1rem'} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={'1rem'} color='red' />;
  }
}
