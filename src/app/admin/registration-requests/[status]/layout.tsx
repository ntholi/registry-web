'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllRegistrationRequests } from '@/server/registration-requests/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { useParams } from 'next/navigation';

type Status = 'pending' | 'registered' | 'rejected' | 'approved';

const statusTitles = {
  pending: 'Pending Registration Requests',
  registered: 'Registered Students',
  rejected: 'Rejected Requests',
  approved: 'Approved Requests',
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
      getData={async (page, search) => {
        const response = await findAllRegistrationRequests(
          page,
          search,
          status,
        );
        return {
          data: response.data.map((item) => ({
            id: item.id,
            stdNo: item.stdNo,
            status: item.status as Status,
            student: item.student,
          })),
          pages: response.pages,
        };
      }}
      actionIcons={[
        <NewLink
          key={'new-link'}
          href='/admin/registration-requests/pending/new'
        />,
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
