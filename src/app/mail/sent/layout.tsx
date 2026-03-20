'use client';

import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { getSentLog } from '../queues/_server/actions';

type SentLogItem = NonNullable<
	Awaited<ReturnType<typeof getSentLog>>
>['items'][number];

export default function SentLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout<SentLogItem>
			path='/mail/sent'
			queryKey={['mail-sent-log']}
			getData={getSentLog}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={item.to}
					description={
						<Text size='xs' c='dimmed' truncate='end'>
							{item.subject}
						</Text>
					}
					rightSection={
						<Group gap={4} wrap='nowrap'>
							<Badge
								size='xs'
								variant='light'
								color={item.triggerType === 'manual' ? 'blue' : 'gray'}
							>
								{item.triggerType}
							</Badge>
							<Badge
								size='xs'
								variant='light'
								color={item.status === 'sent' ? 'green' : 'red'}
							>
								{item.status === 'sent' ? '✓ Sent' : '✗ Failed'}
							</Badge>
							<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
								{formatRelativeTime(item.sentAt)}
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
