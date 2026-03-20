'use client';

import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { getQueueItems } from '../queues/_server/actions';

type QueueItem = NonNullable<
	Awaited<ReturnType<typeof getQueueItems>>
>['items'][number];

export default function QueueLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout<QueueItem>
			path='/mail/queue'
			queryKey={['mail-queue']}
			getData={(page) => getQueueItems(page)}
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
							<Text size='xs' c='dimmed'>
								{item.attempts}/{item.maxAttempts ?? 3}
							</Text>
							<Badge
								size='xs'
								variant='light'
								color={
									statusColors.mailQueueStatus[
										item.status as keyof typeof statusColors.mailQueueStatus
									] ?? 'gray'
								}
							>
								{item.status}
							</Badge>
							<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
								{formatRelativeTime(item.createdAt)}
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
