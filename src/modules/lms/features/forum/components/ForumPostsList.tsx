'use client';

import {
	Avatar,
	Badge,
	Card,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { IconMessage, IconPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getForumDiscussions } from '../server/actions';

type ForumPostsListProps = {
	forumId: number;
};

function ForumPostSkeleton() {
	return (
		<Card withBorder shadow='xs' padding='lg'>
			<Stack gap='md'>
				<Group gap='md' wrap='nowrap' align='flex-start'>
					<Skeleton height={40} circle />
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Group gap='xs' wrap='nowrap'>
							<Skeleton height={16} width={120} />
							<Text c='dimmed' size='xs'>
								·
							</Text>
							<Skeleton height={14} width={80} />
						</Group>
						<Skeleton height={16} width='70%' />
					</Stack>
				</Group>

				<Stack gap='xs'>
					<Skeleton height={14} width='100%' />
					<Skeleton height={14} width='95%' />
					<Skeleton height={14} width='98%' />
				</Stack>

				<Divider />

				<Group gap='xs'>
					<IconMessage size={18} stroke={1.5} style={{ opacity: 0.3 }} />
					<Skeleton height={14} width={60} />
				</Group>
			</Stack>
		</Card>
	);
}

export default function ForumPostsList({ forumId }: ForumPostsListProps) {
	const theme = useMantineTheme();
	const { data: discussions, isLoading } = useQuery({
		queryKey: ['forum-discussions', forumId],
		queryFn: () => getForumDiscussions(forumId),
	});

	if (isLoading) {
		return (
			<Stack gap='md'>
				{[1, 2, 3].map((i) => (
					<ForumPostSkeleton key={i} />
				))}
			</Stack>
		);
	}

	if (!discussions || discussions.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='xs'>
					<IconMessage size={48} stroke={1.5} color={theme.colors.gray[4]} />
					<Text c='dimmed' size='lg'>
						No discussions yet
					</Text>
					<Text c='dimmed' size='sm'>
						Be the first to start a conversation
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{discussions.map((discussion) => (
				<Card key={discussion.id} withBorder shadow='xs' padding='lg'>
					<Stack gap='md'>
						<Group gap='md' wrap='nowrap' align='flex-start'>
							<Avatar
								src={discussion.userpictureurl}
								radius='xl'
								size='md'
								alt={discussion.userfullname}
							/>
							<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
								<Group gap='xs' wrap='nowrap'>
									<Text fw={600} size='sm'>
										{discussion.userfullname}
									</Text>
									<Text c='dimmed' size='xs'>
										·
									</Text>
									<Text size='xs' c='dimmed'>
										{formatDistanceToNow(new Date(discussion.created * 1000), {
											addSuffix: true,
										})}
									</Text>
									{discussion.pinned && (
										<Badge
											size='xs'
											variant='light'
											color='blue'
											leftSection={<IconPin size={12} />}
										>
											Pinned
										</Badge>
									)}
								</Group>
								<Text fw={500} size='sm' lineClamp={2}>
									{discussion.subject}
								</Text>
							</Stack>
						</Group>

						<div
							dangerouslySetInnerHTML={{ __html: discussion.message }}
							style={{
								fontSize: '0.875rem',
								lineHeight: 1.6,
							}}
						/>

						<Divider />

						<Group gap='xs'>
							<IconMessage size={18} stroke={1.5} style={{ opacity: 0.6 }} />
							<Text size='sm' c='dimmed'>
								{discussion.numreplies}{' '}
								{discussion.numreplies === 1 ? 'reply' : 'replies'}
							</Text>
						</Group>
					</Stack>
				</Card>
			))}
		</Stack>
	);
}
