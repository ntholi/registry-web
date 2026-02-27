'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import { getUserSchools } from '@admin/users';
import { employees } from '@human-resource/_database';
import { Autocomplete, MultiSelect, Select, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { getStaffEmailDomain } from '@/config/server-actions';
import type { users } from '@/core/database';
import { Form } from '@/shared/ui/adease';
import UserInput from '@/shared/ui/UserInput';

type Employee = typeof employees.$inferInsert & { schoolIds?: number[] };
type User = typeof users.$inferSelect;

const DEPARTMENTS = [
	'Academic',
	'Finance',
	'Registry',
	'Library',
	'Marketing',
	'Student Services',
	'LEAP',
	'Human Resources',
	'Operations and Resources',
] as const;

type Department = (typeof DEPARTMENTS)[number];

const ROLE_TO_DEPARTMENT: Record<string, Department> = {
	academic: 'Academic',
	finance: 'Finance',
	registry: 'Registry',
	library: 'Library',
	marketing: 'Marketing',
	student_services: 'Student Services',
	leap: 'LEAP',
	human_resource: 'Human Resources',
	resource: 'Operations and Resources',
};

const POSITION_LABELS: Record<string, string> = {
	manager: 'Manager',
	program_leader: 'Program Leader',
	principal_lecturer: 'Principal Lecturer',
	year_leader: 'Year Leader',
	lecturer: 'Lecturer',
	admin: 'Admin',
};

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
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	const { data: emailDomain } = useQuery({
		queryKey: ['staff-email-domain'],
		queryFn: getStaffEmailDomain,
		staleTime: Number.POSITIVE_INFINITY,
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
			{(form) => {
				const dept = form.getValues().department;
				const isAcademic = dept === 'Academic';

				async function handleUserChange(user: User | null) {
					setSelectedUser(user);
					if (!user) {
						form.setFieldValue('userId', null);
						return;
					}
					form.setFieldValue('userId', user.id);
					if (!form.getValues().name && user.name) {
						form.setFieldValue('name', user.name);
					}
					const mapped: Department | undefined = ROLE_TO_DEPARTMENT[user.role];
					if (mapped) {
						form.setFieldValue('department', mapped);
					}
					if (user.position) {
						form.setFieldValue(
							'position',
							POSITION_LABELS[user.position] ?? user.position
						);
					}
					if (user.role === 'academic') {
						const userSchools = await getUserSchools(user.id);
						if (userSchools && userSchools.length > 0) {
							form.setFieldValue(
								'schoolIds' as never,
								userSchools.map((us) => String(us.schoolId))
							);
						}
					}
				}

				return (
					<>
						<TextInput
							label='Employee Number'
							placeholder='e.g., LUCT456'
							disabled={isEdit}
							{...form.getInputProps('empNo')}
						/>
						<UserInput
							label='User'
							placeholder='Search by name or email'
							value={selectedUser}
							onChange={handleUserChange}
							emailDomain={emailDomain}
						/>
						<TextInput label='Full Name' {...form.getInputProps('name')} />
						<Autocomplete
							label='Position'
							placeholder='e.g., Lecturer'
							data={Object.values(POSITION_LABELS)}
							{...form.getInputProps('position')}
						/>
						<Select
							label='Department'
							data={[...DEPARTMENTS]}
							searchable
							{...form.getInputProps('department')}
						/>
						{isAcademic && (
							<MultiSelect
								label='Schools'
								data={schools.map((s) => ({
									value: String(s.id),
									label: s.name,
								}))}
								searchable
								{...form.getInputProps('schoolIds')}
							/>
						)}
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
					</>
				);
			}}
		</Form>
	);
}
