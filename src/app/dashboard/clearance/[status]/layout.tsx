'use client';

import { ListItem, ListLayout } from '@/components/adease';
import {
  registrationClearanceByStatus,
  exportClearancesByStatus,
} from '@/server/clearance/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { PropsWithChildren, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import DownloadCSVButton from '@/components/DownloadCSVButton';
import TermFilter from '@/components/TermFilter';

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
      path={'/dashboard/clearance/' + status}
      queryKey={[
        'registrationClearances',
        status,
        selectedTermId?.toString() || 'all',
      ]}
      getData={async (page, search) => {
        const response = await registrationClearanceByStatus(
          status,
          page,
          search,
          selectedTermId || undefined
        );
        return {
          items: response.items || [],
          totalPages: response.totalPages || 1,
        };
      }}
      actionIcons={[
        <TermFilter
          key='term-filter'
          onTermChange={setSelectedTermId}
          selectedTermId={selectedTermId}
        />,
        <DownloadCSVButton
          key='download-csv'
          status={status}
          onDownload={(status) =>
            exportClearancesByStatus(status, selectedTermId || undefined)
          }
        />,
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
