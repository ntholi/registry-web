import {
	Avatar,
	Badge,
	Box,
	Code,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { formatTableName } from '@/shared/lib/utils/utils';
import { DetailsView, DetailsViewBody, FieldView } from '@/shared/ui/adease';
import {
	DEFAULT_EXCLUDE_FIELDS,
	formatFieldName,
	formatValue,
	getChangedFields,
} from '../_lib/audit-utils';
import { getAuditLog } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

const operationColor: Record<string, string> = {
	INSERT: 'green',
	UPDATE: 'blue',
	DELETE: 'red',
};

export default async function AuditLogDetail({ params }: Props) {
	const { id } = await params;
	const entry = await getAuditLog(BigInt(id));

	if (!entry) {
		return notFound();
	}

	const oldVals = (entry.oldValues ?? {}) as Record<string, unknown>;
	const newVals = (entry.newValues ?? {}) as Record<string, unknown>;
	const meta = entry.metadata as Record<string, unknown> | null;
	const isInsert = entry.operation === 'INSERT';
	const isDelete = entry.operation === 'DELETE';
	const user = entry.changedByUser;

	const changes = isInsert
		? Object.keys(newVals)
				.filter((k) => !DEFAULT_EXCLUDE_FIELDS.includes(k))
				.map((k) => ({ field: k, oldValue: null, newValue: newVals[k] }))
		: isDelete
			? Object.keys(oldVals)
					.filter((k) => !DEFAULT_EXCLUDE_FIELDS.includes(k))
					.map((k) => ({ field: k, oldValue: oldVals[k], newValue: null }))
			: getChangedFields(oldVals, newVals, DEFAULT_EXCLUDE_FIELDS);

	return (
		<DetailsView>
			<Group justify='space-between' align='center' mb='md'>
				<Title order={3} fw={100}>
					Audit Log
				</Title>
				<Badge size='lg' color={operationColor[entry.operation] ?? 'gray'}>
					{entry.operation}
				</Badge>
			</Group>
			<Divider mb='md' />
			<DetailsViewBody>
				<FieldView label='Table'>{formatTableName(entry.tableName)}</FieldView>
				<FieldView label='Record ID'>{entry.recordId}</FieldView>
				<FieldView label='Changed At'>
					{formatDateTime(entry.changedAt)}
				</FieldView>
				<FieldView label='Changed By'>
					{user ? (
						<Group gap='sm'>
							<Avatar
								size='sm'
								radius='xl'
								src={user.image || undefined}
								color='blue'
							>
								{(user.name || user.email || '?')
									.split(' ')
									.map((n) => n[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)}
							</Avatar>
							<div>
								<Text size='sm'>{user.name}</Text>
								<Text size='xs' c='dimmed'>
									{user.email}
								</Text>
							</div>
						</Group>
					) : (
						'System'
					)}
				</FieldView>
				{entry.syncedAt && (
					<FieldView label='Synced At'>
						{formatDateTime(entry.syncedAt)}
					</FieldView>
				)}

				{meta && Object.keys(meta).length > 0 && (
					<Box mt='md'>
						<Text size='sm' fw={500} mb='xs'>
							Metadata
						</Text>
						<Code block>{JSON.stringify(meta, null, 2)}</Code>
					</Box>
				)}

				<Divider my='md' />

				<Text size='sm' fw={500} mb='sm'>
					Changes
				</Text>

				{changes.length === 0 ? (
					<Text size='sm' c='dimmed'>
						No field changes detected
					</Text>
				) : (
					<Paper withBorder p='md'>
						<Stack gap='md'>
							{changes.map((change) => (
								<Box key={change.field}>
									<Text size='xs' c='dimmed' mb={4}>
										{formatFieldName(change.field)}
									</Text>
									<Group gap='xs' wrap='nowrap'>
										{!isInsert && (
											<Text
												size='sm'
												c='red.6'
												td={isDelete ? undefined : 'line-through'}
												style={{ wordBreak: 'break-word' }}
											>
												{formatValue(change.oldValue)}
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
												{formatValue(change.newValue)}
											</Text>
										)}
									</Group>
								</Box>
							))}
						</Stack>
					</Paper>
				)}
			</DetailsViewBody>
		</DetailsView>
	);
}
