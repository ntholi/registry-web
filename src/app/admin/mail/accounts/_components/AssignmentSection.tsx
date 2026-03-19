'use client';

import { ActionIcon, Badge, Stack, Table, Text, Title } from '@mantine/core';
import { IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	getAssignments,
	removeAssignment,
} from '../../assignments/_server/actions';
import AddAssignmentForm from './AddAssignmentForm';

type Props = {
	accountId: string;
};

export default function AssignmentSection({ accountId }: Props) {
	const queryClient = useQueryClient();
	const queryKey = ['mail-assignments', accountId];

	const { data: assignments = [] } = useQuery({
		queryKey,
		queryFn: () => getAssignments(accountId),
	});

	const removeMutation = useActionMutation(
		(id: number) => removeAssignment(id),
		{
			onSuccess: () => queryClient.invalidateQueries({ queryKey }),
		}
	);

	return (
		<Stack mt='lg'>
			<Title order={5}>Assignments</Title>
			{assignments.length > 0 ? (
				<Table highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Type</Table.Th>
							<Table.Th>Assignee</Table.Th>
							<Table.Th>Can Reply</Table.Th>
							<Table.Th>Can Compose</Table.Th>
							<Table.Th />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{assignments.map((a) => (
							<Table.Tr key={a.id}>
								<Table.Td>
									<Badge
										size='sm'
										variant='light'
										color={a.role ? 'blue' : 'teal'}
									>
										{a.role ? 'Role' : 'User'}
									</Badge>
								</Table.Td>
								<Table.Td>
									{a.role
										? toTitleCase(a.role)
										: a.user
											? `${a.user.name || ''} (${a.user.email})`
											: '-'}
								</Table.Td>
								<Table.Td>
									{a.canReply ? (
										<IconCheck size={16} color='var(--mantine-color-green-6)' />
									) : (
										<IconX size={16} color='var(--mantine-color-gray-5)' />
									)}
								</Table.Td>
								<Table.Td>
									{a.canCompose ? (
										<IconCheck size={16} color='var(--mantine-color-green-6)' />
									) : (
										<IconX size={16} color='var(--mantine-color-gray-5)' />
									)}
								</Table.Td>
								<Table.Td>
									<ActionIcon
										variant='subtle'
										color='red'
										size='sm'
										loading={removeMutation.isPending}
										onClick={() => removeMutation.mutate(a.id)}
									>
										<IconTrash size={14} />
									</ActionIcon>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			) : (
				<Text size='sm' c='dimmed'>
					No assignments yet.
				</Text>
			)}
			<AddAssignmentForm accountId={accountId} queryKey={queryKey} />
		</Stack>
	);
}
