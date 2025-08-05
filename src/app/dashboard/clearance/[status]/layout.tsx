'use client';

import { selectedTermAtom } from '@/atoms/termAtoms';
import { ListItem, ListLayout } from '@/components/adease';
import TermFilter from '@/components/TermFilter';
import { registrationClearanceByStatus } from '@/server/clearance/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import { PropsWithChildren } from 'react';

type Status = 'pending' | 'approved' | 'rejected';

type ClearanceItem = {
  id: number;
  status: Status;
  registrationRequest: {
    student: {
      stdNo: number;
      name: string;
    };
  };
};

const statusTitles = {
  pending: 'Pending Clearance Requests',
  approved: 'Approved Clearances',
  rejected: 'Rejected Clearances',
};

export default function Layout({ children }: PropsWithChildren) {
  const params = useParams();
  const status = params.status as Status;
  const [selectedTerm, setSelectedTerm] = useAtom(selectedTermAtom);

  const { data: currentTerm } = useQuery({
    queryKey: ['currentTerm'],
    queryFn: getCurrentTerm,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (currentTerm?.id && selectedTerm === null) {
    setSelectedTerm(currentTerm.id);
  }

  if (!statusTitles[status]) {
    return <div>Invalid status: {status}</div>;
  }

  return (
    <ListLayout
      path={'/dashboard/clearance/' + status}
      queryKey={[
        'registrationClearances',
        status,
        selectedTerm?.toString() || 'all',
      ]}
      getData={async (page, search) => {
        const response = await registrationClearanceByStatus(
          status,
          page,
          search,
          selectedTerm || undefined
        );
        return {
          items: response.items || [],
          totalPages: response.totalPages || 1,
        };
      }}
      actionIcons={[
        <TermFilter key='term-filter' onTermChange={setSelectedTerm} />,
        // <DownloadCSVButton
        //   key='download-csv'
        //   status={status}
        //   onDownload={(status) =>
        //     exportClearancesByStatus(status, selectedTerm || undefined)
        //   }
        // />,
      ]}
      renderItem={(it: ClearanceItem) => (
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
