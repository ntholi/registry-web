'use client';

import type { MoodleCourse } from '@lms/courses/types';
import {
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Modal,
	Progress,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCheck,
	IconRefresh,
	IconUser,
	IconUserPlus,
	IconX,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import {
	enrollStudentInCourse,
	getRegisteredStudentsForSync,
} from '../_server/actions';

type SyncStudentsModalProps = {
	course: MoodleCourse;
	onSuccess?: () => void;
};

type SyncStatus = 'idle' | 'syncing' | 'done';

type StudentSyncResult = {
	stdNo: number;
	name: string;
	status: 'pending' | 'syncing' | 'success' | 'error' | 'skipped';
	message?: string;
};

export default function SyncStudentsModal({
	course,
	onSuccess,
}: SyncStudentsModalProps) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
	const [results, setResults] = useState<StudentSyncResult[]>([]);
	const abortRef = useRef(false);

	const { data: registeredStudents, isLoading } = useQuery({
		queryKey: ['sync-students', course.id],
		queryFn: () => getRegisteredStudentsForSync(course.id),
		enabled: opened,
	});

	const startSync = useCallback(async () => {
		if (!registeredStudents || registeredStudents.length === 0) return;

		abortRef.current = false;
		setSyncStatus('syncing');

		const initialResults: StudentSyncResult[] = registeredStudents.map((s) => ({
			stdNo: s.stdNo,
			name: s.name,
			status: 'pending' as const,
		}));
		setResults(initialResults);

		for (let i = 0; i < registeredStudents.length; i++) {
			if (abortRef.current) break;
			setResults((prev) =>
				prev.map((r, idx) =>
					idx === i ? { ...r, status: 'syncing' as const } : r
				)
			);

			try {
				const result = await enrollStudentInCourse(
					course.id,
					registeredStudents[i].stdNo,
					course.fullname,
					course.shortname
				);

				setResults((prev) =>
					prev.map((r, idx) =>
						idx === i
							? {
									...r,
									status: result.success
										? ('success' as const)
										: ('error' as const),
									message: result.message,
								}
							: r
					)
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((r, idx) =>
						idx === i
							? {
									...r,
									status: 'error' as const,
									message:
										error instanceof Error ? error.message : 'Unknown error',
								}
							: r
					)
				);
			}
		}

		setSyncStatus('done');
		queryClient.invalidateQueries({
			queryKey: ['course-students', course.id],
		});
		onSuccess?.();
	}, [registeredStudents, course, queryClient, onSuccess]);

	function handleClose() {
		if (syncStatus === 'syncing') {
			abortRef.current = true;
		}
		close();
		setSyncStatus('idle');
		setResults([]);
	}

	const successCount = results.filter((r) => r.status === 'success').length;
	const errorCount = results.filter((r) => r.status === 'error').length;
	const processedCount = results.filter(
		(r) => r.status === 'success' || r.status === 'error'
	).length;
	const progressPercent =
		results.length > 0 ? (processedCount / results.length) * 100 : 0;

	function getStatusIcon(status: StudentSyncResult['status']) {
		switch (status) {
			case 'success':
				return (
					<ThemeIcon size='sm' color='green' variant='light' radius='xl'>
						<IconCheck size={12} />
					</ThemeIcon>
				);
			case 'error':
				return (
					<ThemeIcon size='sm' color='red' variant='light' radius='xl'>
						<IconX size={12} />
					</ThemeIcon>
				);
			case 'syncing':
				return <Loader size='xs' />;
			default:
				return (
					<ThemeIcon size='sm' color='gray' variant='light' radius='xl'>
						<IconUser size={12} />
					</ThemeIcon>
				);
		}
	}

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconRefresh size={16} />}
				onClick={open}
			>
				Sync
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Sync Registered Students'
				size='lg'
			>
				<Stack gap='md'>
					{syncStatus === 'idle' && (
						isLoading ? (
								<Box ta='center' py='xl'>
									<Loader size='sm' />
									<Text size='sm' c='dimmed' mt='sm'>
										Loading registered students...
									</Text>
								</Box>
							) : !registeredStudents || registeredStudents.length === 0 ? (
								<Box ta='center' py='xl'>
									<Text size='sm' c='dimmed'>
										No registered students found for your assigned semester
										modules
									</Text>
								</Box>
							) : (
								<>
									<Text size='sm' fw={500}>
										{registeredStudents.length} student
										{registeredStudents.length !== 1 ? 's' : ''} registered
									</Text>
									<ScrollArea.Autosize mah={400}>
										<Stack gap='xs'>
											{registeredStudents.map((student) => (
												<Group
													key={student.stdNo}
													gap='sm'
													px='sm'
													py='xs'
													style={{
														borderRadius: 'var(--mantine-radius-sm)',
														border:
															'1px solid var(--mantine-color-default-border)',
													}}
												>
													<ThemeIcon
														size='sm'
														color='blue'
														variant='light'
														radius='xl'
													>
														<IconUser size={12} />
													</ThemeIcon>
													<Stack gap={0} style={{ flex: 1 }}>
														<Text size='sm' fw={500}>
															{student.name}
														</Text>
														<Text size='xs' c='dimmed'>
															{student.stdNo}
														</Text>
													</Stack>
												</Group>
											))}
										</Stack>
									</ScrollArea.Autosize>
								</>
							)
					)}

					{(syncStatus === 'syncing' || syncStatus === 'done') && (
						<>
							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										{syncStatus === 'syncing'
											? `Enrolling students... (${processedCount}/${results.length})`
											: 'Sync complete'}
									</Text>
									<Group gap='xs'>
										{successCount > 0 && (
											<Badge size='sm' color='green' variant='light'>
												{successCount} enrolled
											</Badge>
										)}
										{errorCount > 0 && (
											<Badge size='sm' color='red' variant='light'>
												{errorCount} failed
											</Badge>
										)}
									</Group>
								</Group>
								<Progress
									value={progressPercent}
									size='sm'
									color={syncStatus === 'done' ? 'green' : 'blue'}
									animated={syncStatus === 'syncing'}
								/>
							</Stack>

							<ScrollArea.Autosize mah={400}>
								<Stack gap='xs'>
									{results.map((result) => (
										<Group
											key={result.stdNo}
											gap='sm'
											px='sm'
											py='xs'
											style={{
												borderRadius: 'var(--mantine-radius-sm)',
												border: '1px solid var(--mantine-color-default-border)',
												opacity: result.status === 'pending' ? 0.5 : 1,
											}}
										>
											{getStatusIcon(result.status)}
											<Stack gap={0} style={{ flex: 1 }}>
												<Text size='sm' fw={500}>
													{result.name}
												</Text>
												<Text size='xs' c='dimmed'>
													{result.stdNo}
												</Text>
											</Stack>
											{result.message && (
												<Text
													size='xs'
													c={result.status === 'success' ? 'green' : 'red'}
													maw={200}
													ta='right'
													lineClamp={1}
												>
													{result.message}
												</Text>
											)}
										</Group>
									))}
								</Stack>
							</ScrollArea.Autosize>
						</>
					)}

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={handleClose}>
							{syncStatus === 'done' ? 'Close' : 'Cancel'}
						</Button>
						{syncStatus === 'idle' && (
							<Button
								leftSection={<IconUserPlus size={16} />}
								onClick={startSync}
								disabled={
									isLoading ||
									!registeredStudents ||
									registeredStudents.length === 0
								}
							>
								Start Sync
							</Button>
						)}
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
