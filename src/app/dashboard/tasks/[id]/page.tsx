import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getTask, deleteTask, updateTaskStatus } from '@/server/tasks/actions';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { format } from 'date-fns';

type Props = {
  params: Promise<{ id: string }>;
};

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'green';
    case 'in_progress':
      return 'blue';
    case 'active':
      return 'cyan';
    case 'scheduled':
      return 'grape';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

export default async function TaskDetails({ params }: Props) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) {
    return notFound();
  }

  const isOverdue =
    task.dueDate &&
    typeof task.dueDate === 'number' &&
    task.dueDate < Date.now() &&
    task.status !== 'completed';

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Task Details'}
        queryKey={['tasks']}
        handleDelete={async () => {
          'use server';
          await deleteTask(id);
        }}
      />
      <DetailsViewBody>
        <Stack gap='lg'>
          <Group gap='md'>
            <Badge size='lg' color={getStatusColor(task.status)}>
              {task.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge size='lg' color={getPriorityColor(task.priority)}>
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
            {isOverdue && (
              <Badge size='lg' color='red'>
                OVERDUE
              </Badge>
            )}
          </Group>

          <FieldView label='Title'>
            <Text size='lg' fw={600}>
              {task.title}
            </Text>
          </FieldView>

          {task.description && (
            <FieldView label='Description'>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{task.description}</Text>
            </FieldView>
          )}

          <Group grow>
            {task.scheduledFor && (
              <FieldView label='Scheduled For'>
                {format(new Date(task.scheduledFor), 'PPpp')}
              </FieldView>
            )}

            {task.dueDate && (
              <FieldView label='Due Date'>
                <Text c={isOverdue ? 'red' : undefined}>
                  {format(new Date(task.dueDate), 'PPpp')}
                </Text>
              </FieldView>
            )}
          </Group>

          {task.completedAt && (
            <FieldView label='Completed At'>
              {format(new Date(task.completedAt), 'PPpp')}
            </FieldView>
          )}

          <FieldView label='Created At'>
            {task.createdAt && typeof task.createdAt === 'number'
              ? format(new Date(task.createdAt * 1000), 'PPpp')
              : 'N/A'}
          </FieldView>

          {task.assignedUsers && task.assignedUsers.length > 0 && (
            <FieldView label='Assigned To'>
              <Stack gap='xs'>
                {task.assignedUsers.map((user) => (
                  <Text key={user.userId} size='sm'>
                    {user.userName} ({user.userEmail})
                  </Text>
                ))}
              </Stack>
            </FieldView>
          )}

          {task.assignedUsers && task.assignedUsers.length === 0 && (
            <FieldView label='Assigned To'>
              <Badge color='blue'>All Department Members</Badge>
            </FieldView>
          )}

          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <Group mt='md'>
              {task.status === 'active' && (
                <form
                  action={async () => {
                    'use server';
                    await updateTaskStatus(id, 'in_progress');
                  }}
                >
                  <Button type='submit' color='blue'>
                    Start Task
                  </Button>
                </form>
              )}

              {task.status === 'in_progress' && (
                <form
                  action={async () => {
                    'use server';
                    await updateTaskStatus(id, 'completed');
                  }}
                >
                  <Button type='submit' color='green'>
                    Complete Task
                  </Button>
                </form>
              )}

              <form
                action={async () => {
                  'use server';
                  await updateTaskStatus(id, 'cancelled');
                }}
              >
                <Button type='submit' color='red' variant='outline'>
                  Cancel Task
                </Button>
              </form>
            </Group>
          )}
        </Stack>
      </DetailsViewBody>
    </DetailsView>
  );
}
