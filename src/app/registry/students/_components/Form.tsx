'use client';

import { Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { students } from '@registry/_database';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { getReligions } from '@/shared/lib/utils/religions';
import { Form } from '@/shared/ui/adease';

type Student = typeof students.$inferInsert;

type Props = {
	onSubmit: (values: Student) => Promise<Student | ActionResult<Student>>;
	defaultValues?: Student;
	onSuccess?: (value: Student) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function StudentForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['students']}
			schema={createInsertSchema(students)}
			defaultValues={defaultValues}
			onSuccess={({ stdNo }) => {
				router.push(`/registry/students/${stdNo}`);
			}}
		>
			{(form) => (
				<>
					<TextInput
						label='National Id'
						{...form.getInputProps('nationalId')}
					/>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<TextInput label='Phone 1' {...form.getInputProps('phone1')} />
					<TextInput label='Phone 2' {...form.getInputProps('phone2')} />
					<Select
						label='Religion'
						data={getReligions()}
						searchable
						clearable
						{...form.getInputProps('religion')}
					/>
					<DateInput
						label='Date of Birth'
						{...form.getInputProps('dateOfBirth')}
					/>
					<Select
						label='Gender'
						data={['male', 'female']}
						{...form.getInputProps('gender')}
					/>
					<Select
						label='Marital Status'
						data={['single', 'married', 'divorced', 'widowed']}
						{...form.getInputProps('maritalStatus')}
					/>
					<TextInput
						label='Structure ID'
						type='number'
						{...form.getInputProps('structureId')}
					/>
				</>
			)}
		</Form>
	);
}
