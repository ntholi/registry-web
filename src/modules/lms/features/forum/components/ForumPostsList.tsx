'use client';

import {
	Avatar,
	Box,
	Card,
	Group,
	Loader,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getForumDiscussions } from '../server/actions';

type ForumPostsListProps = {
	forumId: number;
};

export default function ForumPostsList({ forumId }: ForumPostsListProps) {
	const { data: discussions, isLoading } = useQuery({
		queryKey: ['forum-discussions', forumId],
		queryFn: () => getForumDiscussions(forumId),
	});

	if (isLoading) {
		return (
			<Box ta='center' py='xl'>
				<Loader />
			</Box>
		);
	}

	if (!discussions || discussions.length === 0) {
		return (
			<Box ta='center' py='xl'>
				<Text c='dimmed'>No posts yet</Text>
			</Box>
		);
	}

	return (
		<Stack gap='md'>
			{discussions.map((discussion) => (
				<Card key={discussion.id} withBorder shadow='sm'>
					<Stack gap='sm'>
						<Group justify='space-between'>
							<Group>
								<Avatar src={discussion.userpictureurl} radius='xl' />
								<Box>
									<Text fw={600}>{discussion.userfullname}</Text>
									<Text size='xs' c='dimmed'>
										{format(
											new Date(discussion.created * 1000),
											'MMM dd, yyyy HH:mm'
										)}
									</Text>
								</Box>
							</Group>
						</Group>

						<Title order={4}>{discussion.subject}</Title>

						<Box
							dangerouslySetInnerHTML={{ __html: discussion.message }}
							style={{
								maxWidth: '100%',
							}}
						/>

						{discussion.numreplies > 0 && (
							<Text size='sm' c='dimmed'>
								{discussion.numreplies}{' '}
								{discussion.numreplies === 1 ? 'reply' : 'replies'}
							</Text>
						)}
					</Stack>
				</Card>
			))}
		</Stack>
	);
}
