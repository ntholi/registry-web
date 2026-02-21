'use client';

import {
	Avatar,
	Box,
	Center,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	Timeline,
} from '@mantine/core';
import { IconArrowRight, IconHistory } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DEFAULT_EXCLUDE_FIELDS,
	type FieldLabelMap,
	formatFieldName,
	formatValue,
	getChangedFields,
} from '../_lib/audit-utils';
import { getRecordHistory } from '../_server/actions';

type RecordAuditHistoryProps = {
	tableName: string;
	recordId: string | number;
	fieldLabels?: Record<string, string>;
	excludeFields?: string[];
};

export default function RecordAuditHistory({
	tableName,
	recordId,
	fieldLabels,
	excludeFields = [],
}: RecordAuditHistoryProps) {
	const allExcludeFields = [...DEFAULT_EXCLUDE_FIELDS, ...excludeFields];

	const { data, isLoading } = useQuery({
		queryKey: ['audit-history', tableName, String(recordId)],
		queryFn: () => getRecordHistory(tableName, String(recordId)),
	});

	if (isLoading) {
		return (
			<Center py='xl'>
				<Loader size='sm' />
			</Center>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Center py='xl'>
				<Stack align='center' gap='xs'>
					<ThemeIcon size='xl' variant='light' color='gray'>
						<IconHistory size={24} />
					</ThemeIcon>
					<Text size='sm' c='dimmed'>
						No change history available
					</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<ScrollArea.Autosize mah={500} offsetScrollbars>
			<Timeline bulletSize={32} lineWidth={2} pt='sm'>
				{data.map((entry) => {
					const oldVals = (entry.oldValues ?? {}) as Record<string, unknown>;
					const newVals = (entry.newValues ?? {}) as Record<string, unknown>;
					const meta = entry.metadata as Record<string, unknown> | null;
					const isInsert = entry.operation === 'INSERT';
					const isDelete = entry.operation === 'DELETE';

					const changes = isInsert
						? Object.keys(newVals)
								.filter((k) => !allExcludeFields.includes(k))
								.map((k) => ({
									field: k,
									oldValue: null,
									newValue: newVals[k],
								}))
						: isDelete
							? Object.keys(oldVals)
									.filter((k) => !allExcludeFields.includes(k))
									.map((k) => ({
										field: k,
										oldValue: oldVals[k],
										newValue: null,
									}))
							: getChangedFields(oldVals, newVals, allExcludeFields);

					if (changes.length === 0) return null;

					const user = entry.changedByUser;
					const userName = user?.name || user?.email || 'System';
					const initials = userName
						.split(' ')
						.map((n) => n[0])
						.join('')
						.toUpperCase()
						.slice(0, 2);

					return (
						<Timeline.Item
							key={String(entry.id)}
							bullet={
								<Avatar
									size={28}
									radius='xl'
									color={isInsert ? 'green' : isDelete ? 'red' : 'blue'}
									src={user?.image || undefined}
								>
									{initials}
								</Avatar>
							}
						>
							<Box>
								<Group gap='xs' mb={4}>
									<Text size='sm' fw={500}>
										{userName}
									</Text>
									<Text size='xs' c='dimmed'>
										{formatDateTime(entry.changedAt)}
									</Text>
									<Text
										size='xs'
										fw={600}
										c={isInsert ? 'green' : isDelete ? 'red' : 'blue'}
									>
										{entry.operation}
									</Text>
								</Group>

								<Stack gap='sm' mt='sm'>
									{changes.map((change) => (
										<ChangeItem
											key={change.field}
											field={change.field}
											oldValue={change.oldValue}
											newValue={change.newValue}
											fieldLabels={fieldLabels}
											operation={entry.operation}
										/>
									))}
								</Stack>

								{typeof meta?.reasons === 'string' && meta.reasons && (
									<Box
										mt='sm'
										p='xs'
										style={{
											borderRadius: 'var(--mantine-radius-sm)',
											backgroundColor: 'var(--mantine-color-dark-6)',
										}}
									>
										<Text size='xs' c='dimmed' mb={2}>
											Reason
										</Text>
										<Text size='sm'>{String(meta.reasons)}</Text>
									</Box>
								)}
							</Box>
						</Timeline.Item>
					);
				})}
			</Timeline>
		</ScrollArea.Autosize>
	);
}

type ChangeItemProps = {
	field: string;
	oldValue: unknown;
	newValue: unknown;
	fieldLabels?: FieldLabelMap;
	operation: string;
};

function ChangeItem({
	field,
	oldValue,
	newValue,
	fieldLabels,
	operation,
}: ChangeItemProps) {
	const isInsert = operation === 'INSERT';
	const isDelete = operation === 'DELETE';

	return (
		<Box>
			<Text size='xs' c='dimmed' mb={4}>
				{formatFieldName(field, fieldLabels)}
			</Text>
			<Group gap='xs' wrap='nowrap'>
				{!isInsert && (
					<Text
						size='sm'
						c='red.6'
						td={isDelete ? undefined : 'line-through'}
						style={{ wordBreak: 'break-word' }}
					>
						{formatValue(oldValue)}
					</Text>
				)}
				{!isInsert && !isDelete && (
					<ThemeIcon size='xs' variant='transparent' c='dimmed'>
						<IconArrowRight size={12} />
					</ThemeIcon>
				)}
				{!isDelete && (
					<Text
						size='sm'
						c='green.6'
						fw={500}
						style={{ wordBreak: 'break-word' }}
					>
						{formatValue(newValue)}
					</Text>
				)}
			</Group>
		</Box>
	);
}
