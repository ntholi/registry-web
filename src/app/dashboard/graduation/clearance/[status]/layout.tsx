'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { graduationClearanceByStatus } from '@/server/graduation/clearance/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import { PropsWithChildren } from 'react';

type Status = 'pending' | 'approved' | 'rejected';

type GraduationClearanceItem = {
  id: number;
  status: Status;
  graduationRequest: {
    student: {
      stdNo: number;
      name: string;
    };
  } | null;
};

const statusTitles = {
  pending: 'Pending Graduation Clearance Requests',
  approved: 'Approved Graduation Clearances',
  rejected: 'Rejected Graduation Clearances',
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/dashboard/graduation/clearance/' + status}
      queryKey={['graduationClearances', status]}
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
                  name: `Student #${item.graduationRequest.studentProgram.stdNo}`, // You might want to get actual name from student table
                },
              },
            })
          ),
          totalPages: response.totalPages || 1,
        };
      }}
      actionIcons={[]}
      renderItem={(it: GraduationClearanceItem) => (
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
