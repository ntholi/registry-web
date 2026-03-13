'use client';

import { ActionIcon, Badge, Divider, Flex, Group, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { authClient } from '@/core/auth-client';
import { useViewSelect } from '@/shared/lib/hooks/use-view-select';
import { DeleteButton } from '@/shared/ui/adease';
import { getTypeLabel } from '../_lib/labels';
import type { StudentStatusType } from '../_lib/types';
import { cancelStudentStatus } from '../_server/actions';

type Props = {
	title: string;
	type: StudentStatusType;
	status: string;
	id: string;
};

export default function StatusHeader({ title, type, status, id }: Props) {
	const { data: session } = authClient.useSession();
	const pathname = usePathname();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [, setView] = useViewSelect();
	const searchParams = useSearchParams();
	const newSearchParams = new URLSearchParams(searchParams);
	newSearchParams.set('view', 'details');

	const role = session?.user?.role;
	const canEdit =
		status === 'pending' && (role === 'registry' || role === 'admin');
	const canDelete =
		status === 'pending' && (role === 'registry' || role === 'admin');

	return (
		<>
			<Flex justify='space-between' align='center'>
				{isMobile ? (
					<Group>
						<ActionIcon variant='default' onClick={() => setView('nav')}>
							<IconArrowNarrowLeft size='1rem' />
						</ActionIcon>
						<Title order={3} fw={100} size='1rem'>
							{title}
						</Title>
					</Group>
				) : (
					<Title order={3} fw={100}>
						{title}
					</Title>
				)}
				<Group>
					<Badge variant='light'>{getTypeLabel(type)}</Badge>
					{canDelete && (
						<DeleteButton
							handleDelete={async () => {
								await cancelStudentStatus(id);
							}}
							queryKey={['student-statuses']}
						/>
					)}
					{canEdit && (
						<ActionIcon
							component={Link}
							href={`${pathname}/edit?${newSearchParams.toString()}`}
							variant='outline'
						>
							<IconEdit size='1rem' />
						</ActionIcon>
					)}
				</Group>
			</Flex>
			<Divider my={15} />
		</>
	);
}
