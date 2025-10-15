'use client';

import { Form } from '@/components/adease';
import { getDepartmentUsers } from '@/server/tasks/actions';
import { tasks } from '@/db/schema';
import {
  Checkbox,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import { z } from 'zod';

type Task = typeof tasks.$inferInsert;
type TaskWithAssignments = Task & { assignedUserIds?: string[] };

type TaskFormData = Omit<
  TaskWithAssignments,
  'scheduledFor' | 'dueDate' | 'createdAt' | 'updatedAt' | 'completedAt'
> & {
  scheduledFor?: string | null;
  dueDate?: string | null;
};

type Props = {
  onSubmit: (values: TaskWithAssignments) => Promise<Task>;
  defaultValues?: Partial<TaskFormData>;
  title?: string;
};

const taskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum([
    'scheduled',
    'active',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})
  .extend({
    scheduledFor: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val).getTime() : undefined)),
    dueDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val).getTime() : undefined)),
    assignedUserIds: z.array(z.string()).optional(),
  })
  .omit({
    department: true,
    createdBy: true,
  });

export default function TaskForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [assignToAll, setAssignToAll] = useState(
    !defaultValues?.assignedUserIds ||
      defaultValues.assignedUserIds.length === 0
  );

  useEffect(function loadUsers() {
    getDepartmentUsers().then((data) => {
      if (data) {
        setUsers(
          data.map((u) => ({
            id: u.id,
            name: u.name || '',
            email: u.email || '',
          }))
        );
      }
    });
  }, []);

  return (
    <Form
      title={title}
      action={async (values: TaskWithAssignments) => {
        const taskData: TaskWithAssignments = {
          ...values,
          assignedUserIds: assignToAll ? [] : values.assignedUserIds || [],
        };

        return onSubmit(taskData);
      }}
      queryKey={['tasks']}
      schema={taskSchema}
      defaultValues={{
        status: 'active',
        priority: 'medium',
        ...defaultValues,
      }}
      onSuccess={({ id }) => {
        router.push(`/dashboard/tasks/${id}`);
      }}
    >
      {(form) => {
        console.log('form', form);
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
              minRows={4}
              {...form.getInputProps('description')}
            />

            <Group grow>
              <Select
                label='Status'
                placeholder='Select status'
                required
                data={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'active', label: 'Active' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                {...form.getInputProps('status')}
              />

              <Select
                label='Priority'
                placeholder='Select priority'
                required
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                {...form.getInputProps('priority')}
              />
            </Group>

            <Group grow>
              <DateTimePicker
                label='Scheduled For'
                placeholder='Pick date and time'
                clearable
                {...form.getInputProps('scheduledFor')}
              />

              <DateTimePicker
                label='Due Date'
                placeholder='Pick date and time'
                clearable
                {...form.getInputProps('dueDate')}
              />
            </Group>

            <Stack gap='xs'>
              <Text size='sm' fw={500}>
                Task Assignment
              </Text>
              <Checkbox
                label='Assign to all department members'
                checked={assignToAll}
                onChange={(event) => {
                  setAssignToAll(event.currentTarget.checked);
                  if (event.currentTarget.checked) {
                    form.setFieldValue('assignedUserIds', []);
                  }
                }}
              />

              {!assignToAll && (
                <MultiSelect
                  label='Assign to specific users'
                  placeholder='Select users'
                  data={users.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.email})`,
                  }))}
                  searchable
                  {...form.getInputProps('assignedUserIds')}
                />
              )}
            </Stack>
          </Stack>
        );
      }}
    </Form>
  );
}
