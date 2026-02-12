'use client';

import { Group, Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { getStudentCardPrints } from '@registry/print/student-card';
import { IconPrinter, IconReceipt } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/shared/lib/utils/dates';

type Props = {
	stdNo: number;
	isActive: boolean;
};

export default function PrintHistoryView({ stdNo, isActive }: Props) {
	const { data: prints, isLoading } = useQuery({
		queryKey: ['student-card-prints', stdNo],
		queryFn: () => getStudentCardPrints(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return (
			<Stack>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} height={80} radius='md' />
				))}
			</Stack>
		);
	}

	if (!prints || prints.length === 0) {
		return (
			<Text size='sm' c='dimmed' fs='italic' ta='center' py='xl'>
				No print history found
			</Text>
		);
	}

	return (
		<Stack>
			{prints.map((print) => (
				<Paper key={print.id} withBorder p='md' radius='sm'>
					<Group justify='space-between' align='flex-start'>
						<Group gap='sm'>
							<ThemeIcon variant='light' size='lg' color='gray'>
								<IconPrinter size={18} />
							</ThemeIcon>
							<Stack gap={2}>
								<Text size='sm' fw={500}>
									{print.printedByName}
								</Text>
								<Text size='xs' c='dimmed'>
									{formatDateTime(print.createdAt, 'short')}
								</Text>
							</Stack>
						</Group>
						<Group gap={4}>
							<IconReceipt size={14} color='var(--mantine-color-dimmed)' />
							<Text size='xs' c='dimmed'>
								{print.receiptNo}
							</Text>
						</Group>
					</Group>
				</Paper>
			))}
		</Stack>
	);
}
