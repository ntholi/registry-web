'use client';

import { Group, Switch } from '@mantine/core';
import { findAllRegistrationRequests } from '@registry/registration/requests';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { type PropsWithChildren, useState } from 'react';
import { getActiveTerm } from '@/app/registry/terms';
import { getStatusIcon } from '@/shared/lib/utils/status';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { selectedTermAtom } from '@/shared/ui/atoms/termAtoms';
import TermFilter from '@/shared/ui/TermFilter';

type Status = 'pending' | 'registered' | 'rejected' | 'approved';

export default function Layout({ children }: PropsWithChildren) {
	const [selectedTerm, setSelectedTerm] = useAtom(selectedTermAtom);
	const [includeDeleted, setIncludeDeleted] = useState(false);

	const { data: activeTerm } = useQuery({
		queryKey: ['active-term'],
		queryFn: getActiveTerm,
		staleTime: 5 * 60 * 1000,
	});

	if (activeTerm?.id && selectedTerm === null) {
		setSelectedTerm(activeTerm.id);
	}

	return (
		<ListLayout
			path='/registry/registration/requests'
			queryKey={[
				'registration-requests',
				selectedTerm?.toString() || 'all',
				includeDeleted ? 'with-deleted' : 'active',
			]}
			getData={async (page, search) => {
				const response = await findAllRegistrationRequests(
					page,
					search,
					selectedTerm || undefined,
					includeDeleted
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
				<Group key='filters' gap='xs'>
					<TermFilter onTermChange={setSelectedTerm} />
					<Switch
						size='sm'
						label='Include deleted'
						checked={includeDeleted}
						onChange={(event) => setIncludeDeleted(event.currentTarget.checked)}
					/>
				</Group>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.stdNo.toString()}
					description={it.student.name}
					rightSection={getStatusIcon(it.status, { withColor: true })}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
