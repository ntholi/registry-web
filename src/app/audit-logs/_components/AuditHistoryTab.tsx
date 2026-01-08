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
import { formatDate, formatDateTime } from '@/shared/lib/utils/dates';

interface AuditEntry {
	id: number;
	oldValues: Record<string, unknown>;
	newValues: Record<string, unknown>;
	reasons: string | null;
	updatedAt: Date | string;
	updatedByUser: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	} | null;
}

interface FieldLabelMap {
	[key: string]: string;
}

interface AuditHistoryTabProps {
	data: AuditEntry[] | undefined;
	isLoading: boolean;
	fieldLabels?: FieldLabelMap;
	excludeFields?: string[];
}

const DEFAULT_EXCLUDE_FIELDS = ['createdAt', 'updatedAt', 'id', 'stdNo'];

function formatValue(value: unknown): string {
	if (value === null || value === undefined) return 'Empty';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	if (value instanceof Date) return formatDate(value);
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) {
			return formatDate(date);
		}
	}
	return String(value);
}

function formatFieldName(field: string, fieldLabels?: FieldLabelMap): string {
	if (fieldLabels?.[field]) return fieldLabels[field];
	return field
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

function getChangedFields(
	oldValues: Record<string, unknown>,
	newValues: Record<string, unknown>,
	excludeFields: string[]
): Array<{ field: string; oldValue: unknown; newValue: unknown }> {
	const changes: Array<{
		field: string;
		oldValue: unknown;
		newValue: unknown;
	}> = [];

	const allKeys = new Set([
		...Object.keys(oldValues),
		...Object.keys(newValues),
	]);

	for (const key of allKeys) {
		if (excludeFields.includes(key)) continue;

		const oldVal = oldValues[key];
		const newVal = newValues[key];

		const oldStr = formatValue(oldVal);
		const newStr = formatValue(newVal);

		if (oldStr !== newStr) {
			changes.push({ field: key, oldValue: oldVal, newValue: newVal });
		}
	}

	return changes;
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
					const changes = getChangedFields(
						entry.oldValues,
						entry.newValues,
						allExcludeFields
					);

					if (changes.length === 0) return null;

					const userName =
						entry.updatedByUser?.name ||
						entry.updatedByUser?.email ||
						'Unknown';
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
									src={entry.updatedByUser?.image || undefined}
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
										{formatDateTime(entry.updatedAt)}
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

								{entry.reasons && (
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
										<Text size='sm'>{entry.reasons}</Text>
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
