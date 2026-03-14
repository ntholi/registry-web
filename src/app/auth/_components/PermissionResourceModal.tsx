'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import {
	ACTIONS,
	type Action,
	type PermissionGrant,
	type Resource,
} from '@/core/auth/permissions';
import { toTitleCase } from '@/shared/lib/utils/utils';

export type PermissionResourceOptionGroup = {
	group: string;
	items: { value: Resource; label: string }[];
};

type PermissionResourceMode = 'create' | 'edit';

type PermissionResourceModalProps = {
	mode: PermissionResourceMode;
	opened: boolean;
	onClose: () => void;
	permissions: PermissionGrant[];
	initialResource: Resource | null;
	resourceOptions: PermissionResourceOptionGroup[];
	onSave: (resource: Resource, actions: Action[]) => void;
};

function getActionsByResource(
	permissions: PermissionGrant[],
	resource: Resource | null
) {
	if (!resource) {
		return [];
	}

	return ACTIONS.filter((action) =>
		permissions.some(
			(permission) =>
				permission.resource === resource && permission.action === action
		)
	);
}

function toggleAction(actions: Action[], action: Action) {
	if (actions.includes(action)) {
		return actions.filter((item) => item !== action);
	}

	return ACTIONS.filter((item) => item === action || actions.includes(item));
}

export default function PermissionResourceModal({
	mode,
	opened,
	onClose,
	permissions,
	initialResource,
	resourceOptions,
	onSave,
}: PermissionResourceModalProps) {
	const [resource, setResource] = useState<Resource | null>(initialResource);
	const [actions, setActions] = useState<Action[]>(
		getActionsByResource(permissions, initialResource)
	);

	function handleSave() {
		if (!resource) {
			return;
		}

		onSave(resource, actions);
		onClose();
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={
				mode === 'edit' && resource
					? `${toTitleCase(resource)} Permissions`
					: 'Add Resource'
			}
			centered
			size='lg'
		>
			<Stack gap='md'>
				<Text c='dimmed' size='sm'>
					{mode === 'edit'
						? 'Update the actions for this resource.'
						: 'Select a new resource, then choose the actions to assign.'}
				</Text>
				<Select
					label='Resource'
					placeholder='Select resource'
					searchable
					disabled={mode === 'edit'}
					data={resourceOptions}
					value={resource}
					onChange={(value) => {
						const next = value as Resource | null;
						setResource(next);
						setActions(getActionsByResource(permissions, next));
					}}
				/>
				<Table withTableBorder striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Action</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th ta='right'>Manage</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{ACTIONS.map((action) => {
							const active = actions.includes(action);

							return (
								<Table.Tr key={action}>
									<Table.Td>{toTitleCase(action)}</Table.Td>
									<Table.Td>
										<Group gap='xs'>
											<ThemeIcon
												size='sm'
												radius='xl'
												variant={active ? 'filled' : 'light'}
												color={active ? 'teal' : 'gray'}
											>
												{active ? <IconCheck size={14} /> : <IconX size={14} />}
											</ThemeIcon>
											<Text size='sm'>
												{active ? 'Assigned' : 'Not assigned'}
											</Text>
										</Group>
									</Table.Td>
									<Table.Td>
										<Group justify='flex-end'>
											<ActionIcon
												variant='light'
												color={active ? 'red' : 'teal'}
												disabled={!resource}
												onClick={() => {
													setActions((current) =>
														toggleAction(current, action)
													);
												}}
											>
												{active ? (
													<IconTrash size={16} />
												) : (
													<IconPlus size={16} />
												)}
											</ActionIcon>
										</Group>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
				<Group justify='space-between' align='center'>
					<Text c='dimmed' size='xs'>
						{resource
							? `${actions.length} action${actions.length === 1 ? '' : 's'} selected`
							: 'Choose a resource to manage its actions'}
					</Text>
					<Group gap='xs'>
						<Button variant='default' onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!resource}>
							Save
						</Button>
					</Group>
				</Group>
			</Stack>
		</Modal>
	);
}
