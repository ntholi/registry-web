'use client';

import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

type FormValues = {
	name: string;
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
		},
		validate: {
			name: (v) => (!v.trim() ? 'Category name is required' : null),
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
