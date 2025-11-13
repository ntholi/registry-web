'use client';

import { Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { students } from '@/core/db/schema';
import { Form } from '@/shared/components/adease';

type Student = typeof students.$inferInsert;

type Props = {
	onSubmit: (values: Student) => Promise<Student>;
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
				router.push(`/students/${stdNo}`);
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
					<TextInput label='Religion' {...form.getInputProps('religion')} />
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
