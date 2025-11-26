'use client';

import { clearanceByStatus } from '@registry/registration/requests';
import { getCurrentTerm } from '@registry/terms';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import TermFilter from '@/shared/ui/TermFilter';

type Status = 'pending' | 'approved' | 'rejected';

type ClearanceItem = {
	id: number;
	status: Status;
	registrationRequest: {
		student: {
			stdNo: number;
			name: string;
		};
	} | null;
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
		queryKey: ['current-term'],
		queryFn: getCurrentTerm,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	if (currentTerm?.id && !selectedTerm) {
		setSelectedTerm(currentTerm.id);
	}

	if (!statusTitles[status]) {
		return <div>Invalid status: {status}</div>;
	}

	return (
		<ListLayout
			path={`/registration/clearance/${status}`}
			queryKey={[
				'clearances',
				status,
				selectedTerm?.toString() || currentTerm?.id?.toString() || 'all',
			]}
			getData={async (page, search) => {
				const termToUse = selectedTerm || currentTerm?.id;
				const response = await clearanceByStatus(
					status,
					page,
					search,
					termToUse || undefined
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
					label={it.registrationRequest?.student.stdNo || 'N/A'}
					description={it.registrationRequest?.student.name || 'Unknown'}
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
