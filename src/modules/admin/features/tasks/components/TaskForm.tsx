'use client';

import { findAllByRoles } from '@admin/users';
import {
	Checkbox,
	Divider,
	MultiSelect,
	Select,
	SimpleGrid,
	Stack,
	Textarea,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { tasks } from '@/modules/admin/database';
import type { users } from '@/modules/auth/database';
import { dashboardUsers } from '@/modules/auth/database';
import { Form } from '@/shared/ui/adease';
import type { TaskWithRelations } from '../types';
import MultiStudentInput from './MultiStudentInput';
import MultiUserInput from './MultiUserInput';

type Task = typeof tasks.$inferInsert;
type User = typeof users.$inferSelect;
type StudentBasic = { stdNo: number; name: string };

type Props = {
	onSubmit: (
		values: Task & {
			assigneeIds?: string[];
			assignToRoles?: string[];
			studentIds?: number[];
		}
	) => Promise<Task>;
	defaultValues?: TaskWithRelations | null;
	title?: string;
};

const priorityOptions = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

const statusOptions = [
	{ value: 'todo', label: 'To Do' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const departmentOptions = dashboardUsers.enumValues
	.filter((r) => r !== 'admin')
	.map((role) => ({
		value: role,
		label: role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
	}));

export default function TaskForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { data: session } = useSession();
	const userRole = session?.user?.role;
	const isManager = session?.user?.position === 'manager';
	const isAdmin = userRole === 'admin';
	const canAssignOthers = isManager || isAdmin;

	const defaultAssignees: User[] =
		defaultValues?.assignees?.map((a) => a.user) ?? [];
	const defaultStudents: StudentBasic[] =
		defaultValues?.students?.map((s) => ({
			stdNo: s.student.stdNo,
			name: s.student.name,
		})) ?? [];
	const [selectedUsers, setSelectedUsers] = useState<User[]>(defaultAssignees);
	const [selectedStudents, setSelectedStudents] =
		useState<StudentBasic[]>(defaultStudents);
	const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
	const [assignToAll, setAssignToAll] = useState(false);

	const managerRoleLabel = userRole
		? userRole
				.replace(/_/g, ' ')
				.replace(/\b\w/g, (c: string) => c.toUpperCase())
		: '';

	const { data: departmentUsers = [] } = useQuery({
		queryKey: ['department-users', selectedDepartments],
		queryFn: () => findAllByRoles(selectedDepartments as User['role'][]),
		enabled: isAdmin && selectedDepartments.length > 0 && assignToAll,
	});

	const { data: managerDepartmentUsers = [] } = useQuery({
		queryKey: ['manager-department-users', userRole],
		queryFn: () => findAllByRoles([userRole as User['role']]),
		enabled: isManager && !isAdmin && assignToAll && !!userRole,
	});

	const initialValues = {
		title: defaultValues?.title ?? '',
		description: defaultValues?.description ?? '',
		priority: defaultValues?.priority ?? 'medium',
		status: defaultValues?.status ?? 'todo',
		dueDate: defaultValues?.dueDate ?? null,
		scheduledDate: defaultValues?.scheduledDate ?? null,
	};

	async function handleSubmit(values: Task) {
		let assigneeIds: string[] | undefined;

		if (canAssignOthers) {
			if (assignToAll) {
				if (isAdmin) {
					assigneeIds = departmentUsers.map((u) => u.id);
				} else {
					assigneeIds = managerDepartmentUsers.map((u) => u.id);
				}
			} else {
				assigneeIds = selectedUsers.map((u) => u.id);
			}
		}

		const studentIds = selectedStudents.map((s) => s.stdNo);

		return onSubmit({
			...values,
			assigneeIds,
			studentIds,
		});
	}

	function handleAssignToAllChange(checked: boolean) {
		setAssignToAll(checked);
		if (checked) {
			setSelectedUsers([]);
		}
	}

	return (
		<Form
			title={title}
			action={handleSubmit}
			queryKey={['tasks']}
			schema={createInsertSchema(tasks).omit({
				id: true,
				createdBy: true,
				createdAt: true,
				updatedAt: true,
				completedAt: true,
			})}
			defaultValues={initialValues}
			onSuccess={({ id }) => router.push(`/admin/tasks/${id}`)}
		>
			{(form) => {
				console.log('Form values:', form);
				return (
					<Stack gap='md'>
						<TextInput
							label='Title'
							placeholder='Enter task title'
							required
							{...form.getInputProps('title')}
						/>

						<Textarea
							label='Description'
							placeholder='Enter task description'
							minRows={3}
							autosize
							{...form.getInputProps('description')}
						/>

						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<Select
								label='Priority'
								placeholder='Select priority'
								data={priorityOptions}
								{...form.getInputProps('priority')}
							/>

							<Select
								label='Status'
								placeholder='Select status'
								data={statusOptions}
								{...form.getInputProps('status')}
							/>
						</SimpleGrid>

						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<DateInput
								label='Due Date'
								placeholder='Select due date'
								clearable
								value={
									form.values.dueDate ? new Date(form.values.dueDate) : null
								}
								onChange={(date) =>
									form.setFieldValue('dueDate', date as Date | null)
								}
							/>

							<DateInput
								label='Scheduled Date'
								placeholder='Select scheduled date'
								clearable
								value={
									form.values.scheduledDate
										? new Date(form.values.scheduledDate)
										: null
								}
								onChange={(date) =>
									form.setFieldValue('scheduledDate', date as Date | null)
								}
							/>
						</SimpleGrid>

						{canAssignOthers && (
							<Stack gap='sm'>
								{isAdmin && (
									<MultiSelect
										label='Departments'
										placeholder='Select departments to assign'
										data={departmentOptions}
										value={selectedDepartments}
										onChange={setSelectedDepartments}
										clearable
									/>
								)}

								{(isAdmin ? selectedDepartments.length > 0 : true) && (
									<Checkbox
										label={
											isAdmin
												? 'Assign to all users in selected departments'
												: `Assign to all users in ${managerRoleLabel}`
										}
										checked={assignToAll}
										onChange={(e) => handleAssignToAllChange(e.target.checked)}
									/>
								)}

								<MultiUserInput
									label='Assign to'
									placeholder='Search users to assign'
									value={selectedUsers}
									onChange={setSelectedUsers}
									role={isAdmin ? undefined : (userRole as User['role'])}
									disabled={assignToAll}
								/>
							</Stack>
						)}

						<Divider label='Related Students' labelPosition='left' />

						<MultiStudentInput
							label='Associated Students'
							placeholder='Search students by name or student number'
							value={selectedStudents}
							onChange={setSelectedStudents}
						/>
					</Stack>
				);
			}}
		</Form>
	);
}
