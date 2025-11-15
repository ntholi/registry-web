'use client';

import type { searchModulesWithDetails } from '@academic/semester-modules';
import { getUser } from '@admin/users';
import {
	Button,
	Checkbox,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAllTerms } from '@registry/terms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import type { users } from '@/core/database';
import UserInput from '@/shared/ui/UserInput';
import { ModuleSearchInput } from './ModuleSearchInput';

type User = typeof users.$inferSelect;
type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type FormValues = {
	userId: string;
	termId: number;
	semesterModuleIds: number[];
};

type Props = {
	onSubmit: (values: FormValues) => Promise<void>;
	defaultValues?: Partial<FormValues>;
	title?: string;
};

export default function LecturerAllocationForm({
	onSubmit,
	defaultValues,
	title = 'Assign Modules to Lecturer',
}: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);
	const [selectedSemesterModules, setSelectedSemesterModules] = useState<
		number[]
	>(defaultValues?.semesterModuleIds || []);
	const isUserPreFilled = Boolean(defaultValues?.userId);
	const isTermPreFilled = Boolean(defaultValues?.termId);

	const { data: terms = [] } = useQuery({
		queryKey: ['terms', 'all'],
		queryFn: getAllTerms,
	});

	useEffect(() => {
		async function fetchUser() {
			if (defaultValues?.userId && !selectedUser) {
				const user = await getUser(defaultValues.userId);
				if (user) {
					setSelectedUser(user);
				}
			}
		}
		fetchUser();
	}, [defaultValues?.userId, selectedUser]);

	const form = useForm<FormValues>({
		initialValues: {
			userId: defaultValues?.userId || '',
			termId: defaultValues?.termId || 0,
			semesterModuleIds: defaultValues?.semesterModuleIds || [],
		},
		validate: {
			userId: (value) => (!value ? 'Please select a lecturer' : null),
			termId: (value) => (!value ? 'Please select a term' : null),
		},
	});

	const submitMutation = useMutation({
		mutationFn: onSubmit,
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Modules assigned successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['lecturer-allocations'],
			});
			if (isUserPreFilled && defaultValues?.userId) {
				router.push(`/lecturer-allocations/${defaultValues.userId}`);
			} else {
				router.push('/lecturer-allocations');
			}
		},
		onError: (error) => {
			console.error('Error assigning modules:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to assign modules',
				color: 'red',
			});
		},
	});

	function handleSubmit(values: FormValues) {
		submitMutation.mutate({
			...values,
			semesterModuleIds: selectedSemesterModules,
		});
	}

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
	};

	const handleSemesterModuleToggle = (semesterModuleId: number) => {
		const updatedSelection = selectedSemesterModules.includes(semesterModuleId)
			? selectedSemesterModules.filter((id) => id !== semesterModuleId)
			: [...selectedSemesterModules, semesterModuleId];

		setSelectedSemesterModules(updatedSelection);
		form.setFieldValue('semesterModuleIds', updatedSelection);
	};

	const canAddModules = form.values.userId && form.values.termId;

	return (
		<>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap='md'>
					<Text size='xl' fw={700}>
						{title}
					</Text>

					{isUserPreFilled && selectedUser ? (
						<div>
							<Text size='sm' c='dimmed' mb={4}>
								Lecturer
							</Text>
							<Text size='md' fw={500}>
								{selectedUser.name || 'Unknown'}
							</Text>
							{selectedUser.email && (
								<Text size='sm' c='dimmed'>
									{selectedUser.email}
								</Text>
							)}
						</div>
					) : (
						<UserInput
							label='Lecturer'
							placeholder='Search for a lecturer'
							value={selectedUser}
							onChange={(user) => {
								setSelectedUser(user);
								if (user) {
									form.setFieldValue('userId', user.id);
								}
							}}
							error={form.errors.userId as string}
						/>
					)}

					{isTermPreFilled && defaultValues?.termId ? (
						<div>
							<Text size='sm' c='dimmed' mb={4}>
								Term
							</Text>
							<Text size='md' fw={500}>
								{terms.find((t) => t.id === defaultValues.termId)?.name ||
									'Unknown'}
							</Text>
						</div>
					) : (
						<Select
							label='Term'
							placeholder='Select a term'
							data={terms.map((term) => ({
								value: term.id.toString(),
								label: term.name,
							}))}
							value={form.values.termId ? form.values.termId.toString() : null}
							onChange={(value) => {
								if (value) {
									form.setFieldValue('termId', Number(value));
								}
							}}
							error={form.errors.termId}
							searchable
							required
						/>
					)}

					<Paper withBorder p='md'>
						<Stack gap='sm'>
							<Group justify='space-between'>
								<Text fw={500}>Selected Modules</Text>
								<Button
									size='sm'
									variant='light'
									onClick={open}
									disabled={!canAddModules}
								>
									Add Modules
								</Button>
							</Group>
							{selectedSemesterModules.length > 0 ? (
								<Text size='sm' c='dimmed'>
									{selectedSemesterModules.length} module
									{selectedSemesterModules.length === 1 ? '' : 's'} selected
								</Text>
							) : (
								<Text size='sm' c='dimmed'>
									{canAddModules
										? 'No modules selected. Click "Add Modules" to select.'
										: 'Select a lecturer and term first'}
								</Text>
							)}
						</Stack>
					</Paper>

					<Group justify='flex-end' mt='md'>
						<Button
							variant='subtle'
							onClick={() => router.push('/lecturer-allocations')}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							loading={submitMutation.isPending}
							disabled={selectedSemesterModules.length === 0}
						>
							Save Allocation
						</Button>
					</Group>
				</Stack>
			</form>

			<Modal title='Add Modules' size='xl' opened={opened} onClose={close}>
				<Stack gap='md'>
					<ModuleSearchInput onModuleSelect={handleModuleSelect} required />
					<Paper withBorder p='md'>
						{selectedModule ? (
							<Stack>
								{selectedModule.semesters.map((semester) => (
									<Checkbox.Card
										p='md'
										key={semester.semesterModuleId}
										checked={selectedSemesterModules.includes(
											semester.semesterModuleId
										)}
										onChange={() =>
											handleSemesterModuleToggle(semester.semesterModuleId)
										}
									>
										<Group wrap='nowrap' align='flex-start'>
											<Checkbox.Indicator />
											<div>
												<Text size='sm' fw={500}>
													{semester.programName}
												</Text>
												<Text size='xs' c='dimmed'>
													{semester.semesterName}{' '}
													{`(${semester.studentCount} Students)`}
												</Text>
											</div>
										</Group>
									</Checkbox.Card>
								))}
							</Stack>
						) : (
							<Text c='dimmed'>No module selected</Text>
						)}
					</Paper>
					<Group justify='flex-end' mt='md'>
						<Button variant='subtle' onClick={close}>
							Done
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
