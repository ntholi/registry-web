'use client';

import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { formatTableName } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { getAuditLogs } from './_server/actions';

type AuditLogItem = {
	id: bigint;
	tableName: string;
	recordId: string;
	operation: string;
	changedAt: Date;
	changedByUser: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	} | null;
};

const operationColor: Record<string, string> = {
	INSERT: 'green',
	UPDATE: 'blue',
	DELETE: 'red',
};

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<AuditLogItem>
			path='/audit-logs'
			queryKey={['audit-logs']}
			getData={async (page, search) => getAuditLogs(page, search)}
			renderItem={(item) => (
				<ListItem
					id={String(item.id)}
					label={
						<Group gap='xs'>
							<Text size='sm' fw={500}>
								{formatTableName(item.tableName)}
							</Text>
							<Badge size='xs' color={operationColor[item.operation] ?? 'gray'}>
								{item.operation}
							</Badge>
						</Group>
					}
					description={
						<Group gap='xs'>
							<Text size='xs' c='dimmed'>
								#{item.recordId}
							</Text>
							<Text size='xs' c='dimmed'>
								·
							</Text>
							<Text size='xs' c='dimmed'>
								{item.changedByUser?.name ?? 'System'}
							</Text>
							<Text size='xs' c='dimmed'>
								·
							</Text>
							<Text size='xs' c='dimmed'>
								{formatRelativeTime(item.changedAt)}
							</Text>
						</Group>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
