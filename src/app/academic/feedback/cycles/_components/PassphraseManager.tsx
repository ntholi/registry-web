'use client';

import {
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Modal,
	NumberInput,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import {
	generatePassphrases,
	getClassesForCycle,
	getPassphraseStats,
} from '../_server/actions';
import PassphraseDownloadButton from './PassphraseDownloadButton';

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
	const [generateTarget, setGenerateTarget] = useState<{
		structureSemesterId: number;
		className: string;
		studentCount: number;
		passphraseCount: number;
	} | null>(null);

	const { data: schoolGroups = [], isLoading: classesLoading } = useQuery({
		queryKey: ['feedback-classes', cycleId, termId],
		queryFn: () => getClassesForCycle(cycleId, termId),
	});

	const { data: statsMap, isLoading: statsLoading } = useQuery({
		queryKey: ['feedback-passphrase-stats', cycleId],
		queryFn: () => getPassphraseStats(cycleId),
	});

	const mutation = useMutation({
		mutationFn: ({
			structureSemesterId,
			passphraseCount,
		}: {
			structureSemesterId: number;
			passphraseCount: number;
		}) => generatePassphrases(cycleId, structureSemesterId, passphraseCount),
		onSuccess: (count) => {
			notifications.show({
				title: 'Passphrases Generated',
				message: `${count} passphrases created`,
				color: 'green',
			});
			setGenerateTarget(null);
			queryClient.invalidateQueries({
				queryKey: ['feedback-passphrase-stats', cycleId],
			});
			queryClient.invalidateQueries({
				queryKey: ['feedback-passphrase-slips', cycleId],
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

	function getDefaultPassphraseCount(studentCount: number) {
		return studentCount + Math.ceil(studentCount * 0.1);
	}

	return (
		<Stack gap='lg'>
			<Modal
				opened={Boolean(generateTarget)}
				onClose={() => setGenerateTarget(null)}
				title='Generate Passphrases'
				centered
			>
				{generateTarget && (
					<Stack>
						<Text size='sm'>
							Class:{' '}
							<Text span fw={600}>
								{generateTarget.className}
							</Text>
						</Text>
						<Text size='sm'>
							Students:{' '}
							<Text span fw={600}>
								{generateTarget.studentCount}
							</Text>
						</Text>
						<NumberInput
							label='Passphrases to generate'
							min={1}
							value={generateTarget.passphraseCount}
							onChange={(value) => {
								const next =
									typeof value === 'number' && Number.isFinite(value)
										? Math.max(1, Math.floor(value))
										: 1;
								setGenerateTarget({
									...generateTarget,
									passphraseCount: next,
								});
							}}
						/>
						<Group justify='flex-end'>
							<Button variant='light' onClick={() => setGenerateTarget(null)}>
								Cancel
							</Button>
							<Button
								loading={mutation.isPending}
								onClick={() =>
									mutation.mutate({
										structureSemesterId: generateTarget.structureSemesterId,
										passphraseCount: generateTarget.passphraseCount,
									})
								}
							>
								Generate
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>

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
												leftSection={<IconPlus size={14} />}
												onClick={() =>
													setGenerateTarget({
														structureSemesterId: cls.structureSemesterId,
														className,
														studentCount: cls.studentCount,
														passphraseCount: getDefaultPassphraseCount(
															cls.studentCount
														),
													})
												}
											>
												{total > 0 ? 'Regenerate' : 'Generate'}
											</Button>
											{total > 0 && (
												<PassphraseDownloadButton
													cycleId={cycleId}
													structureSemesterId={cls.structureSemesterId}
													cycleName={cycleName}
													className={className}
												/>
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
