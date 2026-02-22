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
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DEFAULT_EXCLUDE_FIELDS,
	type FieldLabelMap,
	formatFieldName,
	formatValue,
	getChangedFields,
} from '../_lib/audit-utils';

interface AuditEntry {
	id: number | bigint;
	oldValues: Record<string, unknown> | unknown;
	newValues: Record<string, unknown> | unknown;
	reasons?: string | null;
	updatedAt?: Date | string;
	updatedByUser?: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	} | null;
	metadata?: unknown;
	changedAt?: Date | string;
	changedByUser?: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	} | null;
}

interface AuditHistoryTabProps {
	data: AuditEntry[] | undefined;
	isLoading: boolean;
	fieldLabels?: FieldLabelMap;
	excludeFields?: string[];
}

function ChangeItem({
	field,
	oldValue,
	newValue,
	fieldLabels,
}: {
	field: string;
	oldValue: unknown;
	newValue: unknown;
	fieldLabels?: FieldLabelMap;
}) {
	return (
		<Box>
			<Text size='xs' c='dimmed' mb={4}>
				{formatFieldName(field, fieldLabels)}
			</Text>
			<Group gap='xs' wrap='nowrap'>
				<Text
					size='sm'
					c='red.6'
					td='line-through'
					style={{ wordBreak: 'break-word' }}
				>
					{formatValue(oldValue)}
				</Text>
				<ThemeIcon size='xs' variant='transparent' c='dimmed'>
					<IconArrowRight size={12} />
				</ThemeIcon>
				<Text
					size='sm'
					c='green.6'
					fw={500}
					style={{ wordBreak: 'break-word' }}
				>
					{formatValue(newValue)}
				</Text>
			</Group>
		</Box>
	);
}

export default function AuditHistoryTab({
	data,
	isLoading,
	fieldLabels,
	excludeFields = [],
}: AuditHistoryTabProps) {
	const allExcludeFields = [...DEFAULT_EXCLUDE_FIELDS, ...excludeFields];

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
		<ScrollArea.Autosize mah={400} offsetScrollbars>
			<Timeline bulletSize={32} lineWidth={2} pt='sm'>
				{data.map((entry) => {
					const oldVals = (entry.oldValues ?? {}) as Record<string, unknown>;
					const newVals = (entry.newValues ?? {}) as Record<string, unknown>;
					const meta = (entry.metadata ?? {}) as Record<string, unknown>;
					const reasons = entry.reasons ?? (meta.reasons as string) ?? null;
					const user = entry.changedByUser ?? entry.updatedByUser ?? null;
					const timestamp = entry.changedAt ?? entry.updatedAt;

					const changes = getChangedFields(oldVals, newVals, allExcludeFields);

					if (changes.length === 0) return null;

					const userName = user?.name || user?.email || 'Unknown';
					const initials = userName
						.split(' ')
						.map((n) => n[0])
						.join('')
						.toUpperCase()
						.slice(0, 2);

					return (
						<Timeline.Item
							key={entry.id}
							bullet={
								<Avatar
									size={28}
									radius='xl'
									color='blue'
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
										{timestamp ? formatDateTime(timestamp) : ''}
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
										/>
									))}
								</Stack>

								{reasons && (
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
										<Text size='sm'>{reasons}</Text>
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
