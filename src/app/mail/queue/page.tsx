'use client';

import {
	Card,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCheck,
	IconClock,
	IconLoader,
	IconX,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getQueueStatus } from '../queues/_server/actions';

export default function QueuePage() {
	const { data: counts, isLoading } = useQuery({
		queryKey: ['mail-queue-status'],
		queryFn: getQueueStatus,
		refetchInterval: 30_000,
	});

	if (isLoading) {
		return (
			<Stack align='center' justify='center' mt='30vh'>
				<Loader />
			</Stack>
		);
	}

	const stats = [
		{
			label: 'Pending',
			value: (counts?.pending ?? 0) + (counts?.retry ?? 0),
			icon: IconClock,
			color: 'yellow',
		},
		{
			label: 'Processing',
			value: counts?.processing ?? 0,
			icon: IconLoader,
			color: 'blue',
		},
		{
			label: 'Sent Today',
			value: counts?.sent ?? 0,
			icon: IconCheck,
			color: 'green',
		},
		{
			label: 'Failed',
			value: counts?.failed ?? 0,
			icon: IconX,
			color: 'red',
		},
	];

	return (
		<Stack p='xl'>
			<Title order={3} fw={400}>
				Queue Overview
			</Title>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
				{stats.map((s) => (
					<Card key={s.label} withBorder padding='lg'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap={4}>
								<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
									{s.label}
								</Text>
								<Title order={2}>{s.value}</Title>
							</Stack>
							<ThemeIcon variant='light' color={s.color} size='lg' radius='md'>
								<s.icon size={20} />
							</ThemeIcon>
						</Group>
					</Card>
				))}
			</SimpleGrid>
			<Card withBorder padding='lg'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
							Queue Health
						</Text>
						<Text size='sm'>
							{(counts?.failed ?? 0) > 0 ? (
								<Group gap={4}>
									<IconAlertTriangle
										size={14}
										color='var(--mantine-color-red-6)'
									/>
									{counts?.failed} failed emails need attention
								</Group>
							) : (
								'All systems operational'
							)}
						</Text>
					</Stack>
				</Group>
			</Card>
		</Stack>
	);
}
