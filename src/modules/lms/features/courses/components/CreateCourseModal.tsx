'use client';

import { getAssignedModulesByCurrentUser } from '@academic/assigned-modules';
import {
	Alert,
	Badge,
	Button,
	Group,
	Loader,
	Modal,
	Radio,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toClassName } from '@/shared/lib/utils/utils';
import { createMoodleCourse, getMoodleCategories } from '../server/actions';

type AssignedModule = Awaited<
	ReturnType<typeof getAssignedModulesByCurrentUser>
>[number];

export default function CreateCourseModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedModule, setSelectedModule] = useState<AssignedModule | null>(
		null
	);
	const queryClient = useQueryClient();

	const { data: assignedModules, isLoading: modulesLoading } = useQuery({
		queryKey: ['assigned-modules-current-user'],
		queryFn: getAssignedModulesByCurrentUser,
		enabled: opened,
	});

	const { data: categories } = useQuery({
		queryKey: ['moodle-categories'],
		queryFn: getMoodleCategories,
		enabled: opened,
	});

	const createCourseMutation = useMutation({
		mutationFn: async () => {
			if (!selectedModule) {
				throw new Error('Please select a module');
			}

			const module = selectedModule.semesterModule?.module;
			const school =
				selectedModule.semesterModule?.semester?.structure.program.school;

			if (!module || !school) {
				throw new Error('Module or school information is missing');
			}

			const category = categories?.find(
				(cat) =>
					cat.idnumber?.toLowerCase() === school.code?.toLowerCase() ||
					cat.name?.toLowerCase() === school.code?.toLowerCase()
			);

			const categoryId = category?.id ?? 1;

			return createMoodleCourse({
				fullname: module.name,
				shortname: module.code,
				categoryid: categoryId,
				semesterModuleId: selectedModule.semesterModuleId,
			});
		},
		onSuccess: (data) => {
			notifications.show({
				title: 'Course Created',
				message: `Course "${data.shortname}" has been created successfully`,
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['courses'] });
			queryClient.invalidateQueries({
				queryKey: ['assigned-modules-current-user'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to create course',
				color: 'red',
			});
		},
	});

	function handleClose() {
		setSelectedModule(null);
		close();
	}

	function handleModuleSelect(module: AssignedModule) {
		setSelectedModule(module);
	}

	function handleCreateCourse() {
		createCourseMutation.mutate();
	}

	const availableModules = assignedModules?.filter((m) => !m.lmsCourseId);

	return (
		<>
			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				New Course
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Moodle Course'
				size='lg'
			>
				<Stack gap='md'>
					{modulesLoading ? (
						<Group justify='center' py='xl'>
							<Loader />
						</Group>
					) : !availableModules || availableModules.length === 0 ? (
						<Alert color='yellow' title='No Modules Available'>
							You don&apos;t have any assigned modules without a linked course.
							All your modules already have courses created.
						</Alert>
					) : (
						<>
							<Text size='sm' c='dimmed'>
								Select a module from your assigned modules to create a Moodle
								course:
							</Text>

							<Radio.Group
								value={selectedModule?.id?.toString() ?? ''}
								onChange={(value) => {
									const module = availableModules.find(
										(m) => m.id.toString() === value
									);
									if (module) handleModuleSelect(module);
								}}
							>
								<Stack gap='sm'>
									{availableModules.map((assignment) => (
										<Radio.Card
											key={assignment.id}
											value={assignment.id.toString()}
											p='md'
											radius='md'
										>
											<Group wrap='nowrap' align='flex-start'>
												<Radio.Indicator />
												<Group gap='md' align='flex-start' style={{ flex: 1 }}>
													<Stack gap={4} style={{ flex: 1 }}>
														<Text fw={500} size='sm'>
															{assignment.semesterModule?.module?.name ||
																'Unknown Module'}
														</Text>
														{assignment.semesterModule?.semester?.name && (
															<Badge variant='light' color='gray' size='xs'>
																{toClassName(
																	assignment.semesterModule.semester.structure
																		.program.code,
																	assignment.semesterModule.semester.name
																)}
															</Badge>
														)}
													</Stack>
												</Group>
											</Group>
										</Radio.Card>
									))}
								</Stack>
							</Radio.Group>
						</>
					)}

					<Group justify='flex-end' mt='md'>
						<Button variant='subtle' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={handleCreateCourse}
							loading={createCourseMutation.isPending}
							disabled={!selectedModule}
						>
							Create Course
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
