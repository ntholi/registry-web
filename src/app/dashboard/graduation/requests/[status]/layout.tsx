'use client';

import { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/components/adease';
import { graduationClearanceByStatus } from '@/server/graduation/clearance/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useParams } from 'next/navigation';

type Status = 'pending' | 'approved' | 'rejected';

type Item = {
  id: number;
  status: Status;
  graduationRequest: {
    student: { stdNo: number; name: string };
  } | null;
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;

  return (
    <ListLayout
      path={'/dashboard/graduation/requests/' + status}
      queryKey={['graduation-clearances', status]}
      getData={async (page, search) => {
        const response = await graduationClearanceByStatus(
          status,
          page,
          search
        );
        return {
          items: (response.items || []).map(
            (item: {
              id: number;
              status: Status;
              graduationRequest: {
                studentProgram: { stdNo: number };
              };
            }) => ({
              ...item,
              graduationRequest: {
                ...item.graduationRequest,
                student: {
                  stdNo: item.graduationRequest.studentProgram.stdNo,
                  name: `Student #${item.graduationRequest.studentProgram.stdNo}`,
                },
              },
            })
          ),
          totalPages: response.totalPages || 1,
        };
      }}
      renderItem={(it: Item) => (
        <ListItem
          id={it.id}
          label={it.graduationRequest?.student.stdNo || 'N/A'}
          description={it.graduationRequest?.student.name || 'Unknown'}
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
    case 'approved':
      return <IconCheck size={'1rem'} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={'1rem'} color='red' />;
  }
}
