'use client';

import {
	Avatar,
	Badge,
	Box,
	Card,
	Divider,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
	useMantineTheme,
} from '@mantine/core';
import { IconMessage, IconPin } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { getForumDiscussions } from '../server/actions';

type ForumPostsListProps = {
	forumId: number;
};

export default function ForumPostsList({ forumId }: ForumPostsListProps) {
	const theme = useMantineTheme();
	const { data: discussions, isLoading } = useQuery({
		queryKey: ['forum-discussions', forumId],
		queryFn: () => getForumDiscussions(forumId),
	});

	if (isLoading) {
		return (
			<Box ta='center' py='xl'>
				<Loader size='lg' />
			</Box>
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
						<Group justify='space-between' wrap='nowrap'>
							<Group gap='md' wrap='nowrap'>
								<Avatar
									src={discussion.userpictureurl}
									radius='xl'
									size='md'
									alt={discussion.userfullname}
								/>
								<Box style={{ flex: 1, minWidth: 0 }}>
									<Group gap='xs' wrap='nowrap'>
										<Text fw={600} size='sm' truncate>
											{discussion.userfullname}
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
									<Text size='xs' c='dimmed'>
										{formatDistanceToNow(new Date(discussion.created * 1000), {
											addSuffix: true,
										})}
									</Text>
								</Box>
							</Group>
						</Group>

						<Stack gap='sm'>
							<Title order={4} fw={600} size='h5'>
								{discussion.subject}
							</Title>

							<div
								dangerouslySetInnerHTML={{ __html: discussion.message }}
								style={{
									fontSize: '0.875rem',
									lineHeight: 1.6,
								}}
							/>
						</Stack>

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
