'use client';

import { Badge, Group, Stack, Text } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getTasks } from '@/server/tasks/actions';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path={'/dashboard/tasks'}
      queryKey={['tasks']}
      getData={getTasks}
      actionIcons={[<NewLink key={'new-link'} href='/dashboard/tasks/new' />]}
      renderItem={(task) => {
        const isOverdue =
          task.dueDate &&
          typeof task.dueDate === 'number' &&
          task.dueDate < Date.now() &&
          task.status !== 'completed';

        return (
          <ListItem
            id={task.id}
            label={
              <Stack gap={4}>
                <Group gap='xs'>
                  <Text size='sm' fw={500} lineClamp={1}>
                    {task.title}
                  </Text>
                  {isOverdue && <IconAlertCircle size={16} color='red' />}
                </Group>
                <Group gap='xs'>
                  <Badge size='xs' color={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge size='xs' color={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  {task.dueDate && (
                    <Group gap={4}>
                      <IconClock size={12} />
                      <Text size='xs' c='dimmed'>
                        {formatDistanceToNow(new Date(task.dueDate), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>
            }
          />
        );
      }}
    >
      {children}
    </ListLayout>
  );
}
