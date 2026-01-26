'use client';

import {
	Button,
	Group,
	Modal,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStructureSemester } from '../_server/actions';

const SEMESTER_OPTIONS = [
	{ value: 'Year 1 Sem 1', label: 'Year 1 Sem 1' },
	{ value: 'Year 1 Sem 2', label: 'Year 1 Sem 2' },
	{ value: 'Year 2 Sem 1', label: 'Year 2 Sem 1' },
	{ value: 'Year 2 Sem 2', label: 'Year 2 Sem 2' },
	{ value: 'Year 3 Sem 1', label: 'Year 3 Sem 1' },
	{ value: 'Year 3 Sem 2', label: 'Year 3 Sem 2' },
	{ value: 'Year 4 Sem 1', label: 'Year 4 Sem 1' },
	{ value: 'Year 4 Sem 2', label: 'Year 4 Sem 2' },
];

type Props = {
	structureId: number;
	existingSemesterCount: number;
};

export default function AddSemesterModal({
	structureId,
	existingSemesterCount,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const nextSemester = existingSemesterCount + 1;
	const semesterNumber = nextSemester.toString().padStart(2, '0');
	const defaultName = SEMESTER_OPTIONS[existingSemesterCount]?.value ?? '';

	const form = useForm({
		initialValues: {
			name: defaultName,
			totalCredits: 0,
		},
		validate: {
			name: (value) => (!value?.trim() ? 'Name is required' : null),
			totalCredits: (value) =>
				value === null || value === undefined
					? 'Total credits is required'
					: null,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			return createStructureSemester({
				structureId,
				semesterNumber,
				name: values.name.trim(),
				totalCredits: values.totalCredits,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['structure', structureId] });
			notifications.show({
				title: 'Success',
				message: 'Semester added successfully',
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add semester',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		form.reset();
		form.setValues({
			name: SEMESTER_OPTIONS[existingSemesterCount]?.value ?? '',
			totalCredits: 0,
		});
	}

	const handleSubmit = form.onSubmit((values) => {
		mutation.mutate(values);
	});

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={14} />}
				onClick={open}
			>
				Add Semester
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Semester'
				size='sm'
			>
				<form onSubmit={handleSubmit}>
					<Stack gap='md'>
						<TextInput
							label='Semester Number'
							value={semesterNumber}
							disabled
						/>
						<Select
							label='Name'
							placeholder='Select semester'
							data={SEMESTER_OPTIONS}
							{...form.getInputProps('name')}
						/>
						<NumberInput
							label='Total Credits'
							min={0}
							step={1}
							{...form.getInputProps('totalCredits')}
						/>
						<Group justify='flex-end' mt='md'>
							<Button
								variant='light'
								color='gray'
								onClick={handleClose}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button type='submit' loading={mutation.isPending}>
								Add Semester
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
