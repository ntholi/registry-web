'use client';

import { Badge, Group, Text } from '@mantine/core';
import { IconPaperclip } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { formatRelativeTime } from '@/shared/lib/utils/dates';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import type { InboxThread } from '../_lib/types';
import { getInbox } from '../accounts/_server/actions';
import { AccountSelector } from './_components/AccountSelector';
import { ComposeModal } from './_components/ComposeModal';

export default function InboxLayout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const accountId = searchParams.get('account') || '';

	async function getData(page: number, search: string) {
		if (!accountId) return { items: [] as InboxThread[], totalPages: 0 };
		const result = await getInbox(accountId, {
			query: search || undefined,
			maxResults: 20,
		});
		return {
			items: result.threads,
			totalPages: result.nextPageToken ? page + 1 : page,
		};
	}

	return (
		<ListLayout<InboxThread>
			path='/mail/inbox'
			queryKey={['inbox-threads', searchParams.toString()]}
			getData={getData}
			actionIcons={[
				<ComposeModal key='compose' />,
				<AccountSelector key='account' />,
			]}
			renderItem={(thread) => (
				<ListItem
					id={thread.threadId}
					label={
						<Group gap='xs' wrap='nowrap'>
							<Text
								size='sm'
								fw={thread.isRead ? 400 : 700}
								truncate='end'
								style={{ flex: 1 }}
							>
								{thread.from.name || thread.from.email}
							</Text>
							{thread.hasAttachments && (
								<IconPaperclip size={14} opacity={0.5} />
							)}
							{!thread.isRead && (
								<Badge size='xs' circle variant='filled' color='blue'>
									{' '}
								</Badge>
							)}
						</Group>
					}
					description={
						<Group gap='xs' wrap='nowrap' justify='space-between'>
							<Text size='xs' c='dimmed' truncate='end' style={{ flex: 1 }}>
								{thread.subject} — {thread.snippet}
							</Text>
							<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
								{formatRelativeTime(thread.lastMessageAt)}
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
