'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllRegistrationRequests } from '@/server/registration-requests/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { useParams } from 'next/navigation';

type Status = 'pending' | 'registered' | 'rejected';

const statusTitles = {
  pending: 'Pending Registration Requests',
  registered: 'Registered Students',
  rejected: 'Rejected Requests',
};

type ListItem = {
  id: number;
  stdNo: number;
  status: Status;
  student: {
    name: string;
  };
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/admin/registration-requests/' + status}
      queryKey={['registrationRequests', status]}
      getData={(page, search) =>
        findAllRegistrationRequests(page, search, status)
      }
      actionIcons={[
        <NewLink key={'new-link'} href='/admin/registration-requests/new' />,
      ]}
      renderItem={(it: ListItem) => (
        <ListItem
          id={it.id}
          label={it.stdNo.toString()}
          description={it.student.name}
          rightSection={getStatusIcon(it.status)}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}

function getStatusIcon(status: Status) {
  switch (status) {
    case 'pending':
      return <IconClock size={'1rem'} color='orange' />;
    case 'registered':
      return <IconCheck size={'1rem'} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={'1rem'} color='red' />;
  }
}
