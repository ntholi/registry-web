'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPrinter } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import {
	generatePassphrases,
	getClassesForTerm,
	getPassphraseStats,
} from '../_server/actions';
import PassphraseSlips from './PassphraseSlips';

type Props = {
	cycleId: string;
	termId: number;
	cycleName: string;
};

export default function PassphraseManager({
	cycleId,
	termId,
	cycleName,
}: Props) {
	const queryClient = useQueryClient();
	const [printTarget, setPrintTarget] = useState<{
		structureSemesterId: number;
		className: string;
	} | null>(null);

	const { data: schoolGroups = [], isLoading: classesLoading } = useQuery({
		queryKey: ['feedback-classes', termId],
		queryFn: () => getClassesForTerm(termId),
	});

	const { data: statsMap, isLoading: statsLoading } = useQuery({
		queryKey: ['feedback-passphrase-stats', cycleId],
		queryFn: () => getPassphraseStats(cycleId),
	});

	const mutation = useMutation({
		mutationFn: ({
			structureSemesterId,
			studentCount,
		}: {
			structureSemesterId: number;
			studentCount: number;
		}) => generatePassphrases(cycleId, structureSemesterId, studentCount),
		onSuccess: (count) => {
			notifications.show({
				title: 'Passphrases Generated',
				message: `${count} passphrases created`,
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['feedback-passphrase-stats', cycleId],
			});
		},
		onError: (err: Error) => {
			notifications.show({
				title: 'Error',
				message: err.message,
				color: 'red',
			});
		},
	});

	if (classesLoading || statsLoading) {
		return (
			<Group justify='center' py='xl'>
				<Loader size='sm' />
				<Text size='sm' c='dimmed'>
					Loading classes...
				</Text>
			</Group>
		);
	}

	if (schoolGroups.length === 0) {
		return (
			<Text c='dimmed' ta='center' py='lg'>
				No classes found for this term.
			</Text>
		);
	}

	return (
		<Stack gap='lg'>
			{printTarget && (
				<PassphraseSlips
					cycleId={cycleId}
					structureSemesterId={printTarget.structureSemesterId}
					cycleName={cycleName}
					className={printTarget.className}
					onClose={() => setPrintTarget(null)}
				/>
			)}

			{schoolGroups.map((school) => (
				<Box key={school.schoolId}>
					<Title order={5} mb='xs'>
						{school.schoolName}
					</Title>
					<Stack gap='xs'>
						{school.classes.map((cls) => {
							const stats = statsMap?.[cls.structureSemesterId];
							const total = stats?.total ?? 0;
							const used = stats?.used ?? 0;
							const remaining = stats?.remaining ?? 0;
							const className = getStudentClassName({
								semesterNumber: cls.semesterNumber,
								structure: { program: { code: cls.programCode } },
							});

							return (
								<Paper
									key={cls.structureSemesterId}
									withBorder
									p='sm'
									radius='sm'
								>
									<Group justify='space-between' wrap='nowrap'>
										<Box>
											<Group gap='xs'>
												<Text fw={600} size='sm'>
													{className}
												</Text>
												<Badge size='sm' variant='light'>
													{cls.studentCount} students
												</Badge>
											</Group>
											{total > 0 && (
												<Text size='xs' c='dimmed' mt={2}>
													{total} generated · {used} used · {remaining}{' '}
													remaining
												</Text>
											)}
										</Box>
										<Group gap='xs' wrap='nowrap'>
											<Button
												size='xs'
												variant='light'
												loading={
													mutation.isPending &&
													mutation.variables?.structureSemesterId ===
														cls.structureSemesterId
												}
												onClick={() =>
													mutation.mutate({
														structureSemesterId: cls.structureSemesterId,
														studentCount: cls.studentCount,
													})
												}
											>
												{total > 0 ? 'Regenerate' : 'Generate'}
											</Button>
											{total > 0 && (
												<ActionIcon
													variant='light'
													size='md'
													onClick={() =>
														setPrintTarget({
															structureSemesterId: cls.structureSemesterId,
															className,
														})
													}
												>
													<IconPrinter size={16} />
												</ActionIcon>
											)}
										</Group>
									</Group>
								</Paper>
							);
						})}
					</Stack>
				</Box>
			))}
		</Stack>
	);
}
