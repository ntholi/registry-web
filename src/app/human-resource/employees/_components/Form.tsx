'use client';

import { getAllSchools } from '@academic/schools';
import { employees } from '@human-resource/_database';
import { Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Employee = typeof employees.$inferInsert;

type Props = {
	onSubmit: (values: Employee) => Promise<Employee>;
	defaultValues?: Employee;
	title?: string;
};

export default function EmployeeForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const isEdit = !!defaultValues;

	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['employees']}
			schema={createInsertSchema(employees)}
			defaultValues={defaultValues}
			onSuccess={({ empNo }) => {
				router.push(`/human-resource/employees/${empNo}`);
			}}
		>
			{(form) => (
				<>
					<TextInput
						label='Employee Number'
						placeholder='e.g., LUCT456'
						disabled={isEdit}
						{...form.getInputProps('empNo')}
					/>
					<TextInput label='Full Name' {...form.getInputProps('name')} />
					<Select
						label='Status'
						data={[
							'Active',
							'Suspended',
							'Terminated',
							'Resigned',
							'Retired',
							'Deceased',
							'On Leave',
						]}
						{...form.getInputProps('status')}
					/>
					<Select
						label='Type'
						data={['Full-time', 'Part-time', 'Contract', 'Intern']}
						{...form.getInputProps('type')}
					/>
					<Select
						label='School / Department'
						data={schools.map((s) => ({
							value: String(s.id),
							label: s.name,
						}))}
						searchable
						clearable
						{...form.getInputProps('schoolId')}
					/>
				</>
			)}
		</Form>
	);
}
