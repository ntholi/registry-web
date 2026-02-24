'use client';

import { getActivityLabel } from '@admin/activity-tracker/_lib/activity-catalog';
import ChangeItem from '@audit-logs/_components/ChangeItem';
import {
	DEFAULT_EXCLUDE_FIELDS,
	getChangedFields,
} from '@audit-logs/_lib/audit-utils';
import {
	Avatar,
	Badge,
	Box,
	Center,
	Chip,
	Group,
	Loader,
	Pagination,
	Stack,
	Text,
	ThemeIcon,
	Timeline,
} from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getRoleColor } from '@/shared/lib/utils/colors';
import { formatDateTime, formatRelativeTime } from '@/shared/lib/utils/dates';
import {
	STUDENT_AUDIT_TABLE_LABELS,
	type StudentAuditTable,
} from '../../_lib/student-audit-tables';
import {
	getStudentHistory,
	getStudentHistoryTableSummary,
} from '../../_server/history/actions';

type StudentHistoryViewProps = {
	stdNo: number;
	isActive: boolean;
};

export default function StudentHistoryView({
	stdNo,
	isActive,
}: StudentHistoryViewProps) {
	const [page, setPage] = useState(1);
	const [tableFilter, setTableFilter] = useState<string | undefined>(undefined);

	const { data: tableSummary } = useQuery({
		queryKey: ['student-history-tables', stdNo],
		queryFn: () => getStudentHistoryTableSummary(stdNo),
		enabled: isActive,
	});

	const { data, isLoading } = useQuery({
		queryKey: ['student-history', stdNo, page, tableFilter],
		queryFn: () => getStudentHistory(stdNo, page, tableFilter),
		enabled: isActive,
		placeholderData: keepPreviousData,
	});

	function handleTableFilter(table: string | undefined) {
		setTableFilter(table);
		setPage(1);
	}

	if (!isActive) return null;

	return (
		<Stack gap='md'>
			<TableFilterChips
				tableSummary={tableSummary ?? []}
				activeFilter={tableFilter}
				onFilter={handleTableFilter}
			/>
			{isLoading ? (
				<Center py='xl'>
					<Loader size='sm' />
				</Center>
			) : !data || data.items.length === 0 ? (
				<Center py='xl'>
					<Stack align='center' gap='xs'>
						<ThemeIcon size='xl' variant='light' color='gray'>
							<IconHistory size={24} />
						</ThemeIcon>
						<Text size='sm' c='dimmed'>
							No history available
						</Text>
					</Stack>
				</Center>
			) : (
				<>
					<HistoryTimeline entries={data.items} />
					{data.totalPages > 1 && (
						<Center>
							<Pagination
								size='sm'
								total={data.totalPages}
								value={page}
								onChange={setPage}
								siblings={1}
							/>
						</Center>
					)}
					<Text size='xs' c='dimmed' ta='center'>
						{data.totalItems.toLocaleString()}
						{data.totalItems === 1 ? ' entry' : ' entries'}
					</Text>
				</>
			)}
		</Stack>
	);
}

type TableFilterChipsProps = {
	tableSummary: { tableName: string; count: number }[];
	activeFilter: string | undefined;
	onFilter: (table: string | undefined) => void;
};

function TableFilterChips({
	tableSummary,
	activeFilter,
	onFilter,
}: TableFilterChipsProps) {
	if (tableSummary.length === 0) return null;

	return (
		<Group gap='xs'>
			<Chip
				size='xs'
				checked={!activeFilter}
				onChange={() => onFilter(undefined)}
			>
				All
			</Chip>
			{tableSummary.map((ts) => (
				<Chip
					key={ts.tableName}
					size='xs'
					checked={activeFilter === ts.tableName}
					onChange={() =>
						onFilter(activeFilter === ts.tableName ? undefined : ts.tableName)
					}
				>
					{getTableLabel(ts.tableName)} ({ts.count})
				</Chip>
			))}
		</Group>
	);
}

type HistoryEntry = Awaited<
	ReturnType<typeof getStudentHistory>
>['items'][number];

type HistoryTimelineProps = {
	entries: HistoryEntry[];
};

function HistoryTimeline({ entries }: HistoryTimelineProps) {
	return (
		<Timeline bulletSize={36} lineWidth={2}>
			{entries.map((entry) => (
				<HistoryTimelineEntry key={String(entry.id)} entry={entry} />
			))}
		</Timeline>
	);
}

type HistoryTimelineEntryProps = {
	entry: HistoryEntry;
};

function HistoryTimelineEntry({ entry }: HistoryTimelineEntryProps) {
	const oldVals = (entry.oldValues ?? {}) as Record<string, unknown>;
	const newVals = (entry.newValues ?? {}) as Record<string, unknown>;
	const meta = entry.metadata as Record<string, unknown> | null;
	const isInsert = entry.operation === 'INSERT';
	const isDelete = entry.operation === 'DELETE';

	const changes = isInsert
		? Object.keys(newVals)
				.filter((k) => !DEFAULT_EXCLUDE_FIELDS.includes(k))
				.map((k) => ({ field: k, oldValue: null, newValue: newVals[k] }))
		: isDelete
			? Object.keys(oldVals)
					.filter((k) => !DEFAULT_EXCLUDE_FIELDS.includes(k))
					.map((k) => ({ field: k, oldValue: oldVals[k], newValue: null }))
			: getChangedFields(oldVals, newVals, DEFAULT_EXCLUDE_FIELDS);

	const userName = entry.changedByName ?? 'System';
	const initials = userName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	const opColor = isInsert ? 'green' : isDelete ? 'red' : 'blue';
	const changedAt = new Date(entry.changedAt);
	const isRecent = Date.now() - changedAt.getTime() < 7 * 24 * 60 * 60 * 1000;

	return (
		<Timeline.Item
			bullet={
				<Avatar
					size={32}
					radius='xl'
					color={opColor}
					src={entry.changedByImage ?? undefined}
				>
					{initials}
				</Avatar>
			}
		>
			<Box>
				<Group gap='xs' mb={4} wrap='wrap'>
					<Text size='sm' fw={500}>
						{userName}
					</Text>
				</Group>
				<Group gap='xs' mb='xs'>
					<Text size='xs' c='dimmed'>
						{getTableLabel(entry.tableName)}
					</Text>
					<Badge size='xs' variant='dot' color={opColor}>
						{entry.operation}
					</Badge>
					{entry.activityType && (
						<Text size='xs' c='dimmed' fs='italic'>
							{getActivityLabel(entry.activityType)}
						</Text>
					)}
				</Group>
				<Text size='xs' c='dimmed' mb='sm'>
					{isRecent ? formatRelativeTime(changedAt) : formatDateTime(changedAt)}
				</Text>

				{changes.length > 0 && (
					<Box
						p='xs'
						style={{
							borderRadius: 'var(--mantine-radius-sm)',
							backgroundColor: 'var(--mantine-color-dark-6)',
						}}
					>
						<Stack gap='sm'>
							{changes.map((change) => (
								<ChangeItem
									key={change.field}
									field={change.field}
									oldValue={change.oldValue}
									newValue={change.newValue}
									operation={entry.operation}
								/>
							))}
						</Stack>
					</Box>
				)}

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
}

function getTableLabel(tableName: string): string {
	if (tableName in STUDENT_AUDIT_TABLE_LABELS) {
		return STUDENT_AUDIT_TABLE_LABELS[tableName as StudentAuditTable];
	}
	return tableName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
