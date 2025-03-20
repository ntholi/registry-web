import { ClearanceStatsOverall } from '@/server/reports/clearance/service';
import {
  Grid,
  Paper,
  Text,
  SimpleGrid,
  Group,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconX, IconClock, IconUsers } from '@tabler/icons-react';

interface Props {
  data: ClearanceStatsOverall;
}

export function StatsSummary({ data }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, md: 4 }} spacing='md'>
      <Paper withBorder p='md' radius='md'>
        <Group>
          <ThemeIcon size='lg' radius='md' variant='light' color='blue'>
            <IconUsers size='1.5rem' />
          </ThemeIcon>
          <div>
            <Text size='xs' c='dimmed'>
              Total Requests
            </Text>
            <Text fw={700} size='xl'>
              {data.total}
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper withBorder p='md' radius='md'>
        <Group>
          <ThemeIcon size='lg' radius='md' variant='light' color='green'>
            <IconCheck size='1.5rem' />
          </ThemeIcon>
          <div>
            <Text size='xs' c='dimmed'>
              Approved
            </Text>
            <Text fw={700} size='xl'>
              {data.approved}
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper withBorder p='md' radius='md'>
        <Group>
          <ThemeIcon size='lg' radius='md' variant='light' color='red'>
            <IconX size='1.5rem' />
          </ThemeIcon>
          <div>
            <Text size='xs' c='dimmed'>
              Rejected
            </Text>
            <Text fw={700} size='xl'>
              {data.rejected}
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper withBorder p='md' radius='md'>
        <Group>
          <ThemeIcon size='lg' radius='md' variant='light' color='yellow'>
            <IconClock size='1.5rem' />
          </ThemeIcon>
          <div>
            <Text size='xs' c='dimmed'>
              Pending
            </Text>
            <Text fw={700} size='xl'>
              {data.pending}
            </Text>
          </div>
        </Group>
      </Paper>
    </SimpleGrid>
  );
}
