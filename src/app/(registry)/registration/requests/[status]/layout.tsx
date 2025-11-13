'use client';

import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { findAllRegistrationRequests } from '@/server/registry/registration/requests/actions';
import { getCurrentTerm } from '@/server/registry/terms/actions';
import { ListItem, ListLayout } from '@/shared/components/adease';
import TermFilter from '@/shared/components/TermFilter';
import { selectedTermAtom } from '@/shared/lib/atoms/termAtoms';

type Status = 'pending' | 'registered' | 'rejected' | 'approved';

const statusTitles = {
	pending: 'Pending Registration Requests',
	registered: 'Registered Students',
	rejected: 'Rejected Requests',
	approved: 'Approved Requests',
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
			path={`/registration/requests/${status}`}
			queryKey={[
				'registrationRequests',
				status,
				selectedTerm?.toString() || 'all',
			]}
			getData={async (page, search) => {
				const response = await findAllRegistrationRequests(
					page,
					search,
					status,
					selectedTerm || undefined
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
				<TermFilter key='term-filter' onTermChange={setSelectedTerm} />,
			]}
			renderItem={(it) => (
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
