'use client';

import { Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { tasks } from '@/modules/admin/database';
import type { users } from '@/modules/auth/database';
import { Form } from '@/shared/ui/adease';
import type { TaskWithAssignees } from '../types';
import MultiUserInput from './MultiUserInput';

type Task = typeof tasks.$inferInsert;
type User = typeof users.$inferSelect;

type Props = {
	onSubmit: (values: Task & { assigneeIds?: string[] }) => Promise<Task>;
	defaultValues?: TaskWithAssignees | null;
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

export default function TaskForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { data: session } = useSession();
	const isManager = session?.user?.position === 'manager';
	const isAdmin = session?.user?.role === 'admin';
	const canAssignOthers = isManager || isAdmin;

	const defaultAssignees: User[] =
		defaultValues?.assignees?.map((a) => a.user) ?? [];
	const [selectedUsers, setSelectedUsers] = useState<User[]>(defaultAssignees);

	const initialValues = {
		title: defaultValues?.title ?? '',
		description: defaultValues?.description ?? '',
		priority: defaultValues?.priority ?? 'medium',
		status: defaultValues?.status ?? 'todo',
		dueDate: defaultValues?.dueDate ?? null,
		scheduledDate: defaultValues?.scheduledDate ?? null,
	};

	async function handleSubmit(values: Task) {
		const assigneeIds = canAssignOthers
			? selectedUsers.map((u) => u.id)
			: undefined;

		return onSubmit({
			...values,
			assigneeIds,
		});
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
			{(form) => (
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
							value={form.values.dueDate ? new Date(form.values.dueDate) : null}
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
						<MultiUserInput
							label='Assign to'
							placeholder='Search users to assign'
							value={selectedUsers}
							onChange={setSelectedUsers}
						/>
					)}
				</Stack>
			)}
		</Form>
	);
}
