'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Flex,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	useMantineTheme,
} from '@mantine/core';
import { IconExternalLink, IconVideo, IconVideoOff } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getStatusColor } from '@/shared/lib/utils/colors';
import {
	getBigBlueButtonJoinUrl,
	getVirtualClassroomSessions,
} from '../server/actions';

type VirtualClassroomListProps = {
	courseId: number;
};

type VirtualSession = {
	id: number;
	url: string;
	name: string;
	modname: string;
	visible: number;
};

async function handleJoinSession(cmid: number) {
	const joinUrl = await getBigBlueButtonJoinUrl(cmid);
	if (joinUrl) {
		window.open(joinUrl, '_blank', 'noopener,noreferrer');
	}
}

function SessionCardSkeleton() {
	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Skeleton height={40} width={40} radius='md' />
				<Skeleton height={16} width='80%' />
				<Skeleton height={12} width='50%' />
			</Stack>
		</Card>
	);
}

export default function VirtualClassroomList({
	courseId,
}: VirtualClassroomListProps) {
	const theme = useMantineTheme();

	const { data: section, isLoading } = useQuery({
		queryKey: ['virtual-classroom', courseId],
		queryFn: () => getVirtualClassroomSessions(courseId),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{[1, 2, 3].map((i) => (
					<SessionCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	const sessions =
		section?.modules?.filter((m) => m.modname === 'bigbluebuttonbn') || [];

	if (sessions.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconVideoOff
						size={64}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='lg' fw={500}>
						No virtual classroom sessions yet
					</Text>
					<Text c='dimmed' size='sm' ta='center'>
						Create your first virtual classroom session to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
			{sessions.map((session: VirtualSession) => {
				const isHidden = session.visible === 0;

				return (
					<Card
						key={session.id}
						withBorder
						p='lg'
						style={{ cursor: 'pointer' }}
						onClick={() => handleJoinSession(session.id)}
					>
						<Stack gap='md'>
							<Flex justify='space-between' align='flex-start'>
								<Group align='flex-start'>
									<ThemeIcon variant='default' size='xl' color='blue'>
										<IconVideo size={18} stroke={1.5} />
									</ThemeIcon>
									<Box>
										<Text fw={500} size='sm'>
											{session.name}
										</Text>
										<Group gap='xs'>
											<Text size='xs' c='dimmed'>
												Virtual Classroom
											</Text>
											{isHidden && (
												<>
													<Text size='xs' c='dimmed'>
														•
													</Text>
													<Badge
														size='xs'
														variant='light'
														color={getStatusColor('hidden')}
													>
														Hidden
													</Badge>
												</>
											)}
										</Group>
									</Box>
								</Group>
								<ActionIcon variant='subtle' color='gray' size='sm'>
									<IconExternalLink size={16} />
								</ActionIcon>
							</Flex>
						</Stack>
					</Card>
				);
			})}
		</SimpleGrid>
	);
}
