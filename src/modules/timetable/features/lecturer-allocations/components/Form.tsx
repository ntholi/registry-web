'use client';

import type { searchModulesWithDetails } from '@academic/semester-modules';
import { getUser } from '@admin/users';
import {
	Button,
	Checkbox,
	Group,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getAllTerms } from '@registry/terms';
import { useQuery } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { users } from '@/core/database';
import { Form } from '@/shared/ui/adease';
import DurationInput from '@/shared/ui/DurationInput';
import UserInput from '@/shared/ui/UserInput';
import { ModuleSearchInput } from './ModuleSearchInput';

type User = typeof users.$inferSelect;
type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

const schema = z.object({
	userId: z.string().min(1, 'Please select a lecturer'),
	termId: z.number().min(1, 'Please select a term'),
	semesterModuleIds: z
		.array(z.number())
		.min(1, 'Please select at least one module'),
	duration: z.number().min(1, 'Please enter a valid duration'),
	venueTypeIds: z.array(z.number()),
});

type FormValues = {
	userId: string;
	termId: number;
	semesterModuleIds: number[];
	duration: number;
	venueTypeIds: number[];
};

type Props = {
	onSubmit: (values: FormValues) => Promise<FormValues>;
	defaultValues?: Partial<FormValues>;
	title?: string;
};

export default function LecturerAllocationForm({
	onSubmit,
	defaultValues,
	title = 'Assign Modules to Lecturer',
}: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);
	const isUserPreFilled = Boolean(defaultValues?.userId);
	const isTermPreFilled = Boolean(defaultValues?.termId);

	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
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

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
	};
	const initialValues: FormValues = {
		userId: defaultValues?.userId || '',
		termId: defaultValues?.termId || 0,
		semesterModuleIds: defaultValues?.semesterModuleIds || [],
		duration: defaultValues?.duration || 0,
		venueTypeIds: defaultValues?.venueTypeIds || [],
	};

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['lecturer-allocations']}
			schema={schema}
			defaultValues={initialValues}
			onSuccess={(values) => {
				if (isUserPreFilled && values.userId) {
					router.push(`/lecturer-allocations/${values.userId}`);
				} else {
					router.push('/lecturer-allocations');
				}
			}}
		>
			{(form) => {
				const selectedSemesterModules = form.values.semesterModuleIds;
				const canAddModules = Boolean(form.values.userId && form.values.termId);

				const handleSemesterModuleToggle = (semesterModuleId: number) => {
					const updatedSelection = selectedSemesterModules.includes(
						semesterModuleId
					)
						? selectedSemesterModules.filter((id) => id !== semesterModuleId)
						: [...selectedSemesterModules, semesterModuleId];

					form.setFieldValue('semesterModuleIds', updatedSelection);
				};

				const handleDurationChange = (minutes: number) => {
					form.setFieldValue('duration', minutes);
				};

				return (
					<>
						<Stack gap='md'>
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
										} else {
											form.setFieldValue('userId', '');
										}
									}}
									error={form.errors.userId as string | undefined}
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
									value={
										form.values.termId ? form.values.termId.toString() : null
									}
									onChange={(value) => {
										form.setFieldValue('termId', value ? Number(value) : 0);
									}}
									error={form.errors.termId as string | undefined}
									searchable
									required
								/>
							)}

							<DurationInput
								label='Duration'
								value={form.values.duration}
								onChange={handleDurationChange}
								error={form.errors.duration}
								required
							/>

							<MultiSelect
								label='Venue Types'
								placeholder='Select venue types (optional)'
								data={venueTypes.map((vt: { id: number; name: string }) => ({
									value: vt.id.toString(),
									label: vt.name,
								}))}
								value={form.values.venueTypeIds.map((id) => id.toString())}
								onChange={(values) => {
									form.setFieldValue(
										'venueTypeIds',
										values.map((v) => Number(v))
									);
								}}
								searchable
								clearable
							/>

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
									{form.errors.semesterModuleIds && (
										<Text size='xs' c='red'>
											{form.errors.semesterModuleIds}
										</Text>
									)}
								</Stack>
							</Paper>
						</Stack>

						<Modal
							title='Add Modules'
							size='xl'
							opened={opened}
							onClose={close}
						>
							<Stack gap='md'>
								<ModuleSearchInput
									onModuleSelect={handleModuleSelect}
									required
								/>
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
														handleSemesterModuleToggle(
															semester.semesterModuleId
														)
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
			}}
		</Form>
	);
}
