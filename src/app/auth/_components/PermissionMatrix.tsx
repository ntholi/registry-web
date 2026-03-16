'use client';

import { PERMISSION_RESOURCE_GROUPS } from '@auth/permission-presets/_lib/catalog';
import {
	Accordion,
	ActionIcon,
	Box,
	Button,
	Card,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconCheck,
	IconPencil,
	IconPlus,
	IconRefresh,
	IconSearch,
	IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import {
	ACTIONS,
	type Action,
	type PermissionGrant,
	RESOURCES,
	type Resource,
} from '@/core/auth/permissions';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { DeleteButton } from '@/shared/ui/adease';
import PermissionResourceModal, {
	type PermissionResourceOptionGroup,
} from './PermissionResourceModal';

type PermissionMatrixProps = {
	permissions: PermissionGrant[];
	onChange?: (permissions: PermissionGrant[]) => void;
	defaultPermissions?: readonly PermissionGrant[];
	readOnly?: boolean;
};

type ModalMode = 'create' | 'edit';

type ResourceCard = {
	resource: Resource;
	actions: Action[];
};

type GroupedPermission = {
	label: string;
	items: ResourceCard[];
};

const resourceOrder = PERMISSION_RESOURCE_GROUPS.flatMap(
	(group) => group.resources
);
const orderedResources = [
	...resourceOrder,
	...RESOURCES.filter((resource) => !resourceOrder.includes(resource)),
];
const resourceGroupMap = new Map<Resource, string>(
	PERMISSION_RESOURCE_GROUPS.flatMap((group) =>
		group.resources.map((resource) => [resource, group.label] as const)
	)
);
const groupOrder = [
	...PERMISSION_RESOURCE_GROUPS.map((group) => group.label),
	'Other',
];

function grantKey(resource: Resource, action: Action) {
	return `${resource}:${action}`;
}

function getGroupLabel(resource: Resource) {
	return resourceGroupMap.get(resource) ?? 'Other';
}

function getResourceIndex(resource: Resource) {
	const index = orderedResources.indexOf(resource);

	return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sanitizePermissions(permissions: PermissionGrant[]) {
	const allowedResources = new Set<Resource>(RESOURCES);
	const allowedActions = new Set<Action>(ACTIONS);
	const items = new Map<string, PermissionGrant>();

	for (const permission of permissions) {
		if (
			!allowedResources.has(permission.resource) ||
			!allowedActions.has(permission.action)
		) {
			continue;
		}

		items.set(grantKey(permission.resource, permission.action), permission);
	}

	return [...items.values()].sort((left, right) => {
		const resourceDiff =
			getResourceIndex(left.resource) - getResourceIndex(right.resource);

		if (resourceDiff !== 0) {
			return resourceDiff;
		}

		return ACTIONS.indexOf(left.action) - ACTIONS.indexOf(right.action);
	});
}

function matchesPermission(permission: PermissionGrant, query: string) {
	if (!query) {
		return true;
	}

	const term = query.trim().toLowerCase();

	if (!term) {
		return true;
	}

	return [
		getGroupLabel(permission.resource),
		toTitleCase(permission.resource),
		toTitleCase(permission.action),
	]
		.join(' ')
		.toLowerCase()
		.includes(term);
}

function groupPermissions(permissions: PermissionGrant[], query: string) {
	const items = new Map<string, Map<Resource, Action[]>>();

	for (const permission of permissions) {
		if (!matchesPermission(permission, query)) {
			continue;
		}

		const label = getGroupLabel(permission.resource);
		const current = items.get(label) ?? new Map<Resource, Action[]>();
		const actions = current.get(permission.resource) ?? [];
		current.set(permission.resource, [...actions, permission.action]);
		items.set(label, current);
	}

	return [...items.entries()]
		.sort(
			([left], [right]) => groupOrder.indexOf(left) - groupOrder.indexOf(right)
		)
		.map(
			([label, grouped]): GroupedPermission => ({
				label,
				items: [...grouped.entries()]
					.sort(
						([left], [right]) =>
							getResourceIndex(left) - getResourceIndex(right)
					)
					.map(([resource, actions]) => ({
						resource,
						actions: [...actions].sort(
							(left, right) => ACTIONS.indexOf(left) - ACTIONS.indexOf(right)
						),
					})),
			})
		);
}

function buildResourceOptions() {
	return groupOrder
		.map((label) => {
			const items = orderedResources
				.filter((resource) => getGroupLabel(resource) === label)
				.map((resource) => ({
					value: resource,
					label: toTitleCase(resource),
				}));

			if (items.length === 0) {
				return null;
			}

			return {
				group: label,
				items,
			};
		})
		.filter((item): item is PermissionResourceOptionGroup => item !== null);
}

function replaceResourcePermissions(
	permissions: PermissionGrant[],
	resource: Resource,
	actions: Action[]
) {
	const items = permissions.filter(
		(permission) => permission.resource !== resource
	);

	return sanitizePermissions([
		...items,
		...actions.map((action) => ({ resource, action })),
	]);
}

function PermissionCell({ granted }: { granted: boolean }) {
	return (
		<Group justify='center'>
			<ThemeIcon
				size='md'
				radius='xl'
				variant={granted ? 'filled' : 'light'}
				color={granted ? 'teal' : 'gray'}
			>
				{granted ? <IconCheck size={14} /> : <IconX size={14} />}
			</ThemeIcon>
		</Group>
	);
}

function ResourcePermissionCard({
	item,
	readOnly,
	onEdit,
	onDelete,
}: {
	item: ResourceCard;
	readOnly: boolean;
	onEdit: (resource: Resource) => void;
	onDelete: (resource: Resource) => void;
}) {
	return (
		<Paper withBorder radius='md' p='sm'>
			<Stack gap='sm'>
				<Group justify='space-between' align='center' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap'>
						<PermissionCell granted />
						<Box>
							<Text fw={500} size='sm'>
								{toTitleCase(item.resource)}
							</Text>

							<Group gap={'xs'}>
								{item.actions.map((action, _index) => (
									<Card py={2} px={'xs'} key={grantKey(item.resource, action)}>
										<Text size='xs'>{toTitleCase(action)}</Text>
									</Card>
								))}
							</Group>
						</Box>
					</Group>
					{!readOnly ? (
						<Group gap={4} wrap='nowrap'>
							<ActionIcon
								variant='subtle'
								size='sm'
								color='gray'
								onClick={() => onEdit(item.resource)}
								aria-label={`Edit ${toTitleCase(item.resource)}`}
							>
								<IconPencil size={14} />
							</ActionIcon>
							<DeleteButton
								handleDelete={async () => {
									onDelete(item.resource);
								}}
								itemType='resource'
								itemName={toTitleCase(item.resource)}
								message={`All ${item.actions.length} permission(s) will be removed.`}
								typedConfirmation={false}
								onSuccess={() => undefined}
								size='sm'
								variant='subtle'
							/>
						</Group>
					) : null}
				</Group>
			</Stack>
		</Paper>
	);
}

export default function PermissionMatrix({
	permissions,
	onChange,
	defaultPermissions,
	readOnly = false,
}: PermissionMatrixProps) {
	const current = sanitizePermissions(permissions);
	const editable = !readOnly && Boolean(onChange);
	const [opened, { open, close }] = useDisclosure(false);
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<Resource | null>(null);
	const [mode, setMode] = useState<ModalMode>('create');
	const groups = groupPermissions(current, editable ? query : '');
	const assignedResources = new Set(
		current.map((permission) => permission.resource)
	);
	const availableResources = orderedResources.filter(
		(resource) => !assignedResources.has(resource)
	);

	function openCreateModal() {
		setMode('create');
		setSelected(null);
		open();
	}

	function openEditModal(resource: Resource) {
		setMode('edit');
		setSelected(resource);
		open();
	}

	function handleSave(resource: Resource, actions: Action[]) {
		onChange?.(replaceResourcePermissions(current, resource, actions));
	}

	return (
		<Stack gap='xs'>
			<Group justify='space-between' align='center'>
				<Text fw={500}>Permissions</Text>
				{editable ? (
					<Group gap='xs'>
						{defaultPermissions ? (
							<Button
								leftSection={<IconRefresh size={14} />}
								onClick={() =>
									modals.openConfirmModal({
										title: 'Reset to Default',
										children:
											'This will replace all current permissions with the preset defaults. This cannot be undone.',
										labels: { confirm: 'Reset', cancel: 'Cancel' },
										confirmProps: { color: 'orange' },
										onConfirm: () => {
											onChange?.(sanitizePermissions([...defaultPermissions]));
											notifications.show({
												title: 'Permissions Reset',
												message: 'Permissions have been reset to defaults.',
												color: 'teal',
											});
										},
									})
								}
								variant='subtle'
								color='teal'
								size='xs'
							>
								Reset to Default
							</Button>
						) : null}
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={openCreateModal}
							variant='light'
							size='xs'
							disabled={availableResources.length === 0}
						>
							Add
						</Button>
					</Group>
				) : null}
			</Group>
			{editable ? (
				<TextInput
					placeholder='Search assigned permissions'
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
					leftSection={<IconSearch size={16} />}
				/>
			) : null}
			<Divider />
			<Stack gap='md'>
				{groups.length > 0 ? (
					<Accordion variant='separated' multiple defaultValue={[]}>
						{groups.map((group) => (
							<Accordion.Item key={group.label} value={group.label}>
								<Accordion.Control>
									<Text fw={600} size='sm'>
										{group.label}
									</Text>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap='xs'>
										{group.items.map((item) => (
											<ResourcePermissionCard
												key={item.resource}
												item={item}
												readOnly={!editable}
												onEdit={openEditModal}
												onDelete={(resource) =>
													onChange?.(
														current.filter((p) => p.resource !== resource)
													)
												}
											/>
										))}
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						))}
					</Accordion>
				) : (
					<Paper withBorder radius='md' p='lg'>
						<Stack gap='xs' align='center'>
							<ThemeIcon size='lg' radius='xl' variant='light' color='gray'>
								<IconX size={18} />
							</ThemeIcon>
							<Text fw={500} size='sm'>
								{current.length === 0
									? 'No permissions assigned'
									: 'No permissions match your search'}
							</Text>
							{editable ? (
								<Text c='dimmed' size='sm' ta='center'>
									{current.length === 0
										? 'Use Manage Resource to assign the first permission.'
										: 'Try a different search term or clear the search.'}
								</Text>
							) : null}
						</Stack>
					</Paper>
				)}
			</Stack>
			{opened ? (
				<PermissionResourceModal
					key={selected ?? 'new'}
					mode={mode}
					opened={opened}
					onClose={close}
					permissions={current}
					initialResource={selected}
					resourceOptions={
						mode === 'edit'
							? buildResourceOptions()
									.map((group) => ({
										...group,
										items: group.items.filter(
											(item) => item.value === selected
										),
									}))
									.filter((group) => group.items.length > 0)
							: buildResourceOptions()
									.map((group) => ({
										...group,
										items: group.items.filter(
											(item) => !assignedResources.has(item.value)
										),
									}))
									.filter((group) => group.items.length > 0)
					}
					onSave={handleSave}
				/>
			) : null}
		</Stack>
	);
}
