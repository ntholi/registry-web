'use client';

import { findAllRegistrationRequests } from '@registry/registration/requests';
import { getCurrentTerm } from '@registry/terms';
import { getStatusIcon } from '@student-portal/utils';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import TermFilter from '@/shared/ui/TermFilter';

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
		queryKey: ['current-term'],
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
			path={`/registry/registration/requests/${status}`}
			queryKey={[
				'registration-requests',
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
