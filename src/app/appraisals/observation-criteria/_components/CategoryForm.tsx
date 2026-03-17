'use client';

import {
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';

const SECTION_OPTIONS = [
	{ value: 'teaching_observation', label: 'Teaching Observation' },
	{ value: 'assessments', label: 'Assessments' },
	{ value: 'other', label: 'Other' },
];

type Section = 'teaching_observation' | 'assessments' | 'other';

type FormValues = {
	name: string;
	section: Section;
	sortOrder: number;
};

type Props = {
	initialValues?: FormValues;
	onSubmit: (values: FormValues) => void;
	loading?: boolean;
	submitLabel: string;
	onCancel: () => void;
};

export default function CategoryForm({
	initialValues,
	onSubmit,
	loading,
	submitLabel,
	onCancel,
}: Props) {
	const form = useForm<FormValues>({
		initialValues: initialValues ?? {
			name: '',
			section: 'teaching_observation',
			sortOrder: 0,
		},
		validate: {
			name: (v) => (!v.trim() ? 'Category name is required' : null),
			section: (v) => (!v ? 'Section is required' : null),
		},
	});

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<Stack>
				<TextInput
					label='Category Name'
					placeholder='Enter category name...'
					{...form.getInputProps('name')}
				/>
				<Select
					label='Section'
					data={SECTION_OPTIONS}
					{...form.getInputProps('section')}
				/>
				<NumberInput
					label='Sort Order'
					min={0}
					{...form.getInputProps('sortOrder')}
				/>
				<Group justify='flex-end'>
					<Button variant='default' onClick={onCancel}>
						Cancel
					</Button>
					<Button type='submit' loading={loading}>
						{submitLabel}
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
