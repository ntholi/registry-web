'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconArrowLeft,
	IconPlus,
	IconSearch,
	IconUser,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
	enrollStudentInCourse,
	searchStudentsForEnrollment,
} from '../server/actions';
import type { StudentSearchResult } from '../types';

type AddStudentModalProps = {
	courseId: number;
	onSuccess?: () => void;
};

export default function AddStudentModal({
	courseId,
	onSuccess,
}: AddStudentModalProps) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [selectedStudent, setSelectedStudent] =
		useState<StudentSearchResult | null>(null);

	const { data: searchResults, isLoading: isSearching } = useQuery({
		queryKey: ['student-search', debouncedSearch],
		queryFn: () => searchStudentsForEnrollment(debouncedSearch),
		enabled: debouncedSearch.length >= 2 && !selectedStudent,
	});

	const enrollMutation = useMutation({
		mutationFn: () => enrollStudentInCourse(courseId, selectedStudent!.stdNo),
		onSuccess: (result) => {
			if (result.success) {
				notifications.show({
					title: 'Success',
					message: result.message,
					color: 'green',
				});
				handleClose();
				queryClient.invalidateQueries({
					queryKey: ['course-students', courseId],
				});
				onSuccess?.();
			} else {
				notifications.show({
					title: 'Error',
					message: result.message,
					color: 'red',
				});
			}
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to enroll student',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		setSearch('');
		setSelectedStudent(null);
	}

	function handleSelectStudent(student: StudentSearchResult) {
		setSelectedStudent(student);
	}

	function handleClearSelection() {
		setSelectedStudent(null);
		setSearch('');
	}

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Student
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Student to Course'
				size='md'
			>
				<Stack gap='md'>
					{!selectedStudent ? (
						<>
							<TextInput
								placeholder='Search by name or student number...'
								leftSection={<IconSearch size={16} />}
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
								rightSection={isSearching ? <Loader size='xs' /> : null}
							/>

							{debouncedSearch.length >= 2 && (
								<Box>
									{isSearching ? (
										<Box ta='center' py='md'>
											<Loader size='sm' />
										</Box>
									) : searchResults && searchResults.length > 0 ? (
										<Stack gap='xs'>
											{searchResults.map((student) => (
												<Card
													key={student.stdNo}
													padding='sm'
													withBorder
													style={{ cursor: 'pointer' }}
													onClick={() => handleSelectStudent(student)}
												>
													<Group justify='space-between'>
														<Group gap='sm'>
															<ActionIcon
																variant='light'
																color='blue'
																radius='xl'
																size='lg'
															>
																<IconUser size={18} />
															</ActionIcon>
															<Stack gap={2}>
																<Text size='sm' fw={500}>
																	{student.name}
																</Text>
																<Text size='xs' c='dimmed'>
																	{student.stdNo}
																</Text>
															</Stack>
														</Group>
														<IconPlus size={16} opacity={0.5} />
													</Group>
												</Card>
											))}
										</Stack>
									) : (
										<Text size='sm' c='dimmed' ta='center' py='md'>
											No students found
										</Text>
									)}
								</Box>
							)}
						</>
					) : (
						<Card withBorder padding='md'>
							<Stack gap='md'>
								<Group justify='space-between'>
									<Text size='lg' fw={600}>
										Selected Student
									</Text>
									<Button
										variant='subtle'
										color='red'
										size='xs'
										leftSection={<IconArrowLeft size={14} />}
										onClick={handleClearSelection}
									>
										Change
									</Button>
								</Group>

								<Stack gap='xs'>
									<Group justify='space-between'>
										<Text size='sm' c='dimmed'>
											Name
										</Text>
										<Text size='sm' fw={500}>
											{selectedStudent.name}
										</Text>
									</Group>
									<Group justify='space-between'>
										<Text size='sm' c='dimmed'>
											Student Number
										</Text>
										<Text size='sm' fw={500}>
											{selectedStudent.stdNo}
										</Text>
									</Group>
									<Group justify='space-between'>
										<Text size='sm' c='dimmed'>
											Program
										</Text>
										<Text size='sm' fw={500} maw={200} ta='right' lineClamp={1}>
											{selectedStudent.programName}
										</Text>
									</Group>
									<Group justify='space-between'>
										<Text size='sm' c='dimmed'>
											Current Semester
										</Text>
										<Badge variant='light' size='sm'>
											Semester {selectedStudent.semesterNumber}
										</Badge>
									</Group>
								</Stack>

								{!selectedStudent.userId && (
									<Text size='xs' c='orange' ta='center'>
										Note: This student has no linked user account
									</Text>
								)}
							</Stack>
						</Card>
					)}

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => enrollMutation.mutate()}
							loading={enrollMutation.isPending}
							disabled={!selectedStudent || !selectedStudent.userId}
						>
							Enroll Student
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
