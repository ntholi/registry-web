'use client';

import { Group, Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { getEmployeeCardPrintHistory } from '../../_server/actions';

type Props = {
	empNo: string;
	isActive: boolean;
};

export default function PrintHistoryView({ empNo, isActive }: Props) {
	const { data: prints, isLoading } = useQuery({
		queryKey: ['employee-card-prints', empNo],
		queryFn: () => getEmployeeCardPrintHistory(empNo),
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
					<Group gap='sm'>
						<ThemeIcon variant='light' size='lg' color='gray'>
							<IconPrinter size={18} />
						</ThemeIcon>
						<Stack gap={2}>
							<Text size='sm' fw={500}>
								{print.changedByName}
							</Text>
							<Text size='xs' c='dimmed'>
								{formatDateTime(print.changedAt, 'short')}
							</Text>
						</Stack>
					</Group>
				</Paper>
			))}
		</Stack>
	);
}
