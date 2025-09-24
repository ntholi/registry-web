'use client';

import { ListItem, ListLayout } from '@/components/adease';
import { findAllGraduationRequests } from '@/server/graduation/requests/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';
import { useParams } from 'next/navigation';

type Status = 'pending' | 'rejected' | 'approved';

const statusTitles = {
  pending: 'Pending Graduation Requests',
  rejected: 'Rejected Requests',
  approved: 'Approved Requests',
};

type ListItem = {
  id: number;
  studentProgram: {
    stdNo: number;
    student: {
      name: string;
    };
    structure: {
      program: {
        name: string;
      };
    };
  };
  informationConfirmed: boolean;
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/dashboard/graduation/requests/' + status}
      queryKey={['graduationRequests', status]}
      getData={async (page, search) => {
        const response = await findAllGraduationRequests(page, search, status);
        return {
          items: response.data.map((item) => ({
            id: item.id,
            studentProgram: item.studentProgram,
            informationConfirmed: item.informationConfirmed,
          })),
          totalPages: response.pages,
        };
      }}
      renderItem={(it: ListItem) => (
        <ListItem
          id={it.id}
          label={it.studentProgram.stdNo.toString()}
          description={`${it.studentProgram.student.name} - ${it.studentProgram.structure.program.name}`}
          rightSection={getStatusIcon(status, it.informationConfirmed)}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}

function getStatusIcon(status: Status, informationConfirmed: boolean) {
  switch (status) {
    case 'pending':
      return <IconClock size={'1rem'} color='orange' />;
    case 'approved':
      return <IconCheck size={'1rem'} color='green' />;
    case 'rejected':
      return <IconAlertCircle size={'1rem'} color='red' />;
    default:
      return <IconClock size={'1rem'} color='orange' />;
  }
}
