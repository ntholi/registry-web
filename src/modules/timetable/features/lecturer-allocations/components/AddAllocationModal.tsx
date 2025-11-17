'use client';

import type { searchModulesWithDetails } from '@academic/semester-modules';
import {
	Button,
	Group,
	Modal,
	MultiSelect,
	Select,
	Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllVenueTypes } from '@timetable/venue-types';
import { zod4Resolver as zodResolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import DurationInput from '@/shared/ui/DurationInput';
import { createLecturerAllocationWithVenueTypes } from '../server/actions';
import { ModuleSearchInput } from './ModuleSearchInput';

const schema = z.object({
	semesterModuleId: z.number().min(1, 'Please select a semester module'),
	duration: z.number().min(1, 'Please enter a valid duration'),
	venueTypeIds: z.array(z.number()),
});

type FormValues = z.infer<typeof schema>;

type Props = {
	userId: string;
	termId: number;
};

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

export default function AddAllocationModal({ userId, termId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [selectedModule, setSelectedModule] = useState<Module | null>(null);

	const { data: venueTypes = [] } = useQuery({
		queryKey: ['venue-types'],
		queryFn: getAllVenueTypes,
	});

	const form = useForm<FormValues>({
		validate: zodResolver(schema),
		initialValues: {
			semesterModuleId: 0,
			duration: 30,
			venueTypeIds: [],
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			return createLecturerAllocationWithVenueTypes(
				{
					userId,
					termId,
					semesterModuleId: values.semesterModuleId,
					duration: values.duration,
				},
				values.venueTypeIds
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['lecturer-allocations'],
				refetchType: 'all',
			});
			notifications.show({
				title: 'Success',
				message: 'Allocation added successfully',
				color: 'green',
			});
			form.reset();
			setSelectedModule(null);
			close();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add allocation',
				color: 'red',
			});
		},
	});

	const handleSubmit = (values: FormValues) => {
		mutation.mutate(values);
	};

	const handleOpen = () => {
		form.reset();
		setSelectedModule(null);
		open();
	};

	const handleModuleSelect = (module: Module | null) => {
		setSelectedModule(module);
		if (module && module.semesters.length > 0) {
			form.setFieldValue('semesterModuleId', 0);
		}
	};

	const semesterOptions =
		selectedModule?.semesters.map((semester) => ({
			value: semester.semesterModuleId.toString(),
			label: `${semester.programName} - ${semester.semesterName} (${semester.studentCount} Students)`,
		})) || [];

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={handleOpen}
			>
				Add
			</Button>

			<Modal opened={opened} onClose={close} title='Add Allocation' size='md'>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack gap='md'>
						<ModuleSearchInput onModuleSelect={handleModuleSelect} required />

						<Select
							label='Semester Module'
							placeholder='Select a semester module'
							data={semesterOptions}
							value={
								form.values.semesterModuleId
									? form.values.semesterModuleId.toString()
									: null
							}
							onChange={(value) => {
								form.setFieldValue(
									'semesterModuleId',
									value ? Number(value) : 0
								);
							}}
							error={form.errors.semesterModuleId}
							disabled={!selectedModule || semesterOptions.length === 0}
							searchable
							required
						/>

						<DurationInput
							label='Duration'
							value={form.values.duration}
							onChange={(value) => form.setFieldValue('duration', value)}
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

						<Group justify='flex-end' mt='md'>
							<Button variant='subtle' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={mutation.isPending}>
								Add Allocation
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
