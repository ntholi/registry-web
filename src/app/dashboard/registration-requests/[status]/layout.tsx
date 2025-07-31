'use client';

import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { findAllRegistrationRequests } from '@/server/registration-requests/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import TermFilter from '@/components/TermFilter';

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
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  const { data: currentTerm } = useQuery({
    queryKey: ['currentTerm'],
    queryFn: getCurrentTerm,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (currentTerm?.id && selectedTermId === null) {
    setSelectedTermId(currentTerm.id);
  }

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/dashboard/registration-requests/' + status}
      queryKey={[
        'registrationRequests',
        status,
        selectedTermId?.toString() || 'all',
      ]}
      getData={async (page, search) => {
        const response = await findAllRegistrationRequests(
          page,
          search,
          status,
          selectedTermId || undefined
        );
        return {
          items: response.data.map((item) => ({
            id: item.id,
            stdNo: item.stdNo,
            status: item.status as Status,
            student: item.student,
          })),
          totalPages: response.pages,
        };
      }}
      actionIcons={[
        <TermFilter
          key='term-filter'
          onTermChange={setSelectedTermId}
          selectedTermId={selectedTermId}
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
