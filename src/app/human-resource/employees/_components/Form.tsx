'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import { resolvePresetPosition } from '@admin/notifications/_lib/presetPositions';
import { getUser } from '@admin/users';
import { employees } from '@human-resource/_database';
import {
	Autocomplete,
	MultiSelect,
	Select,
	SimpleGrid,
	TextInput,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { getStaffEmailDomain } from '@/config/server-actions';
import type { users } from '@/core/database';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import { Form } from '@/shared/ui/adease';
import UserInput from '@/shared/ui/UserInput';

type Employee = typeof employees.$inferInsert & { schoolIds?: number[] };
type EmployeeRecord = typeof employees.$inferSelect;
type User = typeof users.$inferSelect;
type UserDetail = NonNullable<Awaited<ReturnType<typeof getUser>>>;

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

function getPositionLabel(position: string | null | undefined) {
	if (!position) {
		return null;
	}

	return POSITION_LABELS[position] ?? null;
}

type Props = {
	onSubmit: (
		values: Employee
	) => Promise<EmployeeRecord | ActionResult<EmployeeRecord>>;
	defaultValues?: Partial<Employee>;
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
	const values = {
		status: 'Active' as const,
		...defaultValues,
	};

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
		<Form<Employee, Partial<Employee> | undefined, EmployeeRecord>
			title={title}
			action={onSubmit}
			queryKey={['employees']}
			schema={createInsertSchema(employees)}
			defaultValues={values}
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

					const detail = (await getUser(user.id)) as UserDetail | null;
					form.setFieldValue('userId', user.id);
					if (!form.getValues().name && user.name) {
						form.setFieldValue('name', user.name);
					}
					const mapped: Department | undefined = ROLE_TO_DEPARTMENT[user.role];
					if (mapped) {
						form.setFieldValue('department', mapped);
					}
					const position = getPositionLabel(
						resolvePresetPosition(user.role, detail?.preset?.name)
					);
					form.setFieldValue('position', position);
					form.setFieldValue(
						'schoolIds' as never,
						user.role === 'academic'
							? (detail?.schoolIds ?? []).map((schoolId) => String(schoolId))
							: []
					);
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
						<TextInput
							label='Title'
							placeholder='e.g., Mr, Ms, Dr'
							{...form.getInputProps('title')}
						/>
						<TextInput label='Full Name' {...form.getInputProps('name')} />
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<Select
								label='Department'
								data={[...DEPARTMENTS]}
								searchable
								{...form.getInputProps('department')}
							/>
							<Autocomplete
								label='Position'
								placeholder='e.g., Lecturer'
								data={Object.values(POSITION_LABELS)}
								{...form.getInputProps('position')}
							/>
						</SimpleGrid>
						<Select
							label='Status'
							data={[
								'Active',
								'Suspended',
								'Terminated',
								'Retired',
								'Deceased',
							]}
							{...form.getInputProps('status')}
						/>
						{isAcademic && (
							<MultiSelect
								label='Schools'
								placeholder='Select schools'
								data={schools.map((s) => ({
									value: String(s.id),
									label: s.name,
								}))}
								searchable
								{...form.getInputProps('schoolIds')}
							/>
						)}
					</>
				);
			}}
		</Form>
	);
}
