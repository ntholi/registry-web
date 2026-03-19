'use client';

import { findAllUsers } from '@admin/users/_server/actions';
import {
	ActionIcon,
	Badge,
	Button,
	Group,
	SegmentedControl,
	Select,
	Stack,
	Switch,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { IconCheck, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	assignToRole,
	assignToUser,
	getAssignments,
	removeAssignment,
} from '../../assignments/_server/actions';

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

type AddFormProps = {
	accountId: string;
	queryKey: string[];
};

function AddAssignmentForm({ accountId, queryKey }: AddFormProps) {
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<'role' | 'user'>('role');
	const [role, setRole] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [canReply, setCanReply] = useState(true);
	const [canCompose, setCanCompose] = useState(false);
	const [open, setOpen] = useState(false);

	const { data: usersResult } = useQuery({
		queryKey: ['users-for-assignment'],
		queryFn: () => findAllUsers(1, ''),
		enabled: mode === 'user' && open,
	});

	const users = usersResult?.items ?? [];

	const assignRoleMutation = useActionMutation(
		(vars: {
			accountId: string;
			role: string;
			perms: { canCompose?: boolean; canReply?: boolean };
		}) => assignToRole(vars.accountId, vars.role, vars.perms),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey });
				resetForm();
			},
		}
	);

	const assignUserMutation = useActionMutation(
		(vars: {
			accountId: string;
			userId: string;
			perms: { canCompose?: boolean; canReply?: boolean };
		}) => assignToUser(vars.accountId, vars.userId, vars.perms),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey });
				resetForm();
			},
		}
	);

	function resetForm() {
		setRole(null);
		setUserId(null);
		setCanReply(true);
		setCanCompose(false);
	}

	function handleSubmit() {
		const perms = { canReply, canCompose };
		if (mode === 'role' && role) {
			assignRoleMutation.mutate({ accountId, role, perms });
		} else if (mode === 'user' && userId) {
			assignUserMutation.mutate({ accountId, userId, perms });
		}
	}

	if (!open) {
		return (
			<Button
				variant='light'
				size='compact-sm'
				leftSection={<IconPlus size={14} />}
				onClick={() => setOpen(true)}
				w='fit-content'
			>
				Add Assignment
			</Button>
		);
	}

	const isPending =
		assignRoleMutation.isPending || assignUserMutation.isPending;
	const canSubmit = mode === 'role' ? !!role : !!userId;

	return (
		<Stack
			gap='sm'
			p='md'
			style={{
				border: '1px solid var(--mantine-color-default-border)',
				borderRadius: 'var(--mantine-radius-md)',
			}}
		>
			<SegmentedControl
				value={mode}
				onChange={(v) => {
					setMode(v as 'role' | 'user');
					resetForm();
				}}
				data={[
					{ label: 'Assign to Role', value: 'role' },
					{ label: 'Assign to User', value: 'user' },
				]}
				size='xs'
			/>
			{mode === 'role' ? (
				<Select
					label='Role'
					placeholder='Select a role'
					data={DASHBOARD_ROLES.map((r) => ({
						value: r,
						label: toTitleCase(r),
					}))}
					value={role}
					onChange={setRole}
					searchable
				/>
			) : (
				<Select
					label='User'
					placeholder='Search by name or email'
					data={users.map((u) => ({
						value: u.id,
						label: `${u.name || ''} (${u.email})`,
					}))}
					value={userId}
					onChange={setUserId}
					searchable
				/>
			)}
			<Group>
				<Switch
					label='Can Reply'
					checked={canReply}
					onChange={(e) => setCanReply(e.currentTarget.checked)}
				/>
				<Switch
					label='Can Compose'
					checked={canCompose}
					onChange={(e) => setCanCompose(e.currentTarget.checked)}
				/>
			</Group>
			<Group>
				<Button
					size='compact-sm'
					onClick={handleSubmit}
					loading={isPending}
					disabled={!canSubmit}
				>
					Add
				</Button>
				<Button
					size='compact-sm'
					variant='subtle'
					onClick={() => {
						setOpen(false);
						resetForm();
					}}
				>
					Cancel
				</Button>
			</Group>
		</Stack>
	);
}
