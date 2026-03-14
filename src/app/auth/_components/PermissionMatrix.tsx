'use client';

import { PERMISSION_RESOURCE_GROUPS } from '@auth/permission-presets/_lib/catalog';
import {
	Checkbox,
	Group,
	Paper,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Fragment } from 'react';
import {
	ACTIONS,
	type Action,
	type PermissionGrant,
	type Resource,
} from '@/core/auth/permissions';
import { toTitleCase } from '@/shared/lib/utils/utils';

type PermissionMatrixProps = {
	permissions: PermissionGrant[];
	onChange?: (permissions: PermissionGrant[]) => void;
	readOnly?: boolean;
};

const resourceOrder = PERMISSION_RESOURCE_GROUPS.flatMap(
	(group) => group.resources
);

function grantKey(resource: Resource, action: Action) {
	return `${resource}:${action}`;
}

function sortPermissions(permissions: PermissionGrant[]) {
	return [...permissions].sort((left, right) => {
		const resourceDiff =
			resourceOrder.indexOf(left.resource) -
			resourceOrder.indexOf(right.resource);

		if (resourceDiff !== 0) {
			return resourceDiff;
		}

		return ACTIONS.indexOf(left.action) - ACTIONS.indexOf(right.action);
	});
}

function sanitizePermissions(permissions: PermissionGrant[]) {
	const allowedResources = new Set<Resource>(resourceOrder);
	const items = new Map<string, PermissionGrant>();

	for (const permission of permissions) {
		if (!allowedResources.has(permission.resource)) {
			continue;
		}

		items.set(grantKey(permission.resource, permission.action), permission);
	}

	return sortPermissions([...items.values()]);
}

function togglePermission(
	permissions: PermissionGrant[],
	resource: Resource,
	action: Action
) {
	const next = new Map<string, PermissionGrant>(
		sanitizePermissions(permissions).map((permission) => [
			grantKey(permission.resource, permission.action),
			permission,
		])
	);
	const key = grantKey(resource, action);

	if (next.has(key)) {
		next.delete(key);
	} else {
		next.set(key, { resource, action });
	}

	return sortPermissions([...next.values()]);
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

export default function PermissionMatrix({
	permissions,
	onChange,
	readOnly = false,
}: PermissionMatrixProps) {
	const current = sanitizePermissions(permissions);
	const granted = new Set(
		current.map((permission) =>
			grantKey(permission.resource, permission.action)
		)
	);

	return (
		<Stack gap='sm'>
			<Text fw={500}>Permissions</Text>
			<Paper withBorder radius='md' p='xs'>
				<Table
					withTableBorder={false}
					striped
					highlightOnHover={!readOnly}
					stickyHeader
				>
					<Table.Thead>
						<Table.Tr>
							<Table.Th miw={220}>Resource</Table.Th>
							{ACTIONS.map((action) => (
								<Table.Th key={action} ta='center'>
									{toTitleCase(action)}
								</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{PERMISSION_RESOURCE_GROUPS.map((group) => (
							<Fragment key={group.label}>
								<Table.Tr>
									<Table.Td
										colSpan={ACTIONS.length + 1}
										bg='var(--mantine-color-default-hover)'
									>
										<Text fw={600} size='sm'>
											{group.label}
										</Text>
									</Table.Td>
								</Table.Tr>
								{group.resources.map((resource) => (
									<Table.Tr key={resource}>
										<Table.Td>
											<Text size='sm'>{toTitleCase(resource)}</Text>
										</Table.Td>
										{ACTIONS.map((action) => {
											const key = grantKey(resource, action);
											const isGranted = granted.has(key);

											return (
												<Table.Td key={key} ta='center'>
													{readOnly ? (
														<PermissionCell granted={isGranted} />
													) : (
														<Checkbox
															checked={isGranted}
															onChange={() => {
																onChange?.(
																	togglePermission(current, resource, action)
																);
															}}
															label={null}
															mx='auto'
														/>
													)}
												</Table.Td>
											);
										})}
									</Table.Tr>
								))}
							</Fragment>
						))}
					</Table.Tbody>
				</Table>
			</Paper>
		</Stack>
	);
}
