'use client';

import { PERMISSION_RESOURCE_GROUPS } from '@auth/permission-presets/_lib/catalog';
import {
	Badge,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCheck,
	IconPencil,
	IconPlus,
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
import PermissionResourceModal, {
	type PermissionResourceOptionGroup,
} from './PermissionResourceModal';

type PermissionMatrixProps = {
	permissions: PermissionGrant[];
	onChange?: (permissions: PermissionGrant[]) => void;
	readOnly?: boolean;
};

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
				size='sm'
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
}: {
	item: ResourceCard;
	readOnly: boolean;
	onEdit: (resource: Resource) => void;
}) {
	return (
		<Paper withBorder radius='md' p='sm'>
			<Stack gap='sm'>
				<Group justify='space-between' align='center' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap'>
						<PermissionCell granted />
						<Stack gap={2}>
							<Text fw={500} size='sm'>
								{toTitleCase(item.resource)}
							</Text>
							<Text c='dimmed' size='xs'>
								{item.actions.length} action
								{item.actions.length === 1 ? '' : 's'} assigned
							</Text>
						</Stack>
					</Group>
					{!readOnly ? (
						<Button
							variant='subtle'
							size='xs'
							leftSection={<IconPencil size={14} />}
							onClick={() => onEdit(item.resource)}
						>
							Manage
						</Button>
					) : null}
				</Group>
				<Group gap='xs'>
					{item.actions.map((action) => (
						<Badge
							key={grantKey(item.resource, action)}
							radius='sm'
							variant='light'
							color='blue'
						>
							{toTitleCase(action)}
						</Badge>
					))}
				</Group>
			</Stack>
		</Paper>
	);
}

export default function PermissionMatrix({
	permissions,
	onChange,
	readOnly = false,
}: PermissionMatrixProps) {
	const current = sanitizePermissions(permissions);
	const editable = !readOnly && Boolean(onChange);
	const [opened, { open, close }] = useDisclosure(false);
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<Resource | null>(null);
	const groups = groupPermissions(current, editable ? query : '');

	function openModal(resource: Resource | null) {
		setSelected(resource);
		open();
	}

	function handleSave(resource: Resource, actions: Action[]) {
		onChange?.(replaceResourcePermissions(current, resource, actions));
	}

	return (
		<Stack gap='sm'>
			<Group justify='space-between' align='center'>
				<Group gap='xs'>
					<Text fw={500}>Permissions</Text>
					<Badge radius='sm' variant='light'>
						{current.length}
					</Badge>
				</Group>
				{editable ? (
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => openModal(null)}
						variant='light'
						size='xs'
					>
						Manage Resource
					</Button>
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
			<Stack gap='md'>
				{groups.length > 0 ? (
					groups.map((group) => (
						<Paper key={group.label} withBorder radius='md' p='md'>
							<Stack gap='sm'>
								<Group justify='space-between' align='center'>
									<Text fw={600} size='sm'>
										{group.label}
									</Text>
									<Badge radius='sm' variant='dot' color='teal'>
										{group.items.length}
									</Badge>
								</Group>
								<Stack gap='xs'>
									{group.items.map((item) => (
										<ResourcePermissionCard
											key={item.resource}
											item={item}
											readOnly={!editable}
											onEdit={openModal}
										/>
									))}
								</Stack>
							</Stack>
						</Paper>
					))
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
					opened={opened}
					onClose={close}
					permissions={current}
					initialResource={selected}
					resourceOptions={buildResourceOptions()}
					onSave={handleSave}
				/>
			) : null}
		</Stack>
	);
}
