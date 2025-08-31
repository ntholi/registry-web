import { formatDateTime } from '@/lib/utils';
import {
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { getStatusColor, getStatusIcon } from '../../utils/status';
import { getGraduationRequest } from '@/server/graduation/requests/actions';

interface Props {
  graduationRequest: NonNullable<
    Awaited<ReturnType<typeof getGraduationRequest>>
  >;
}

export default function GraduationClearanceView({ graduationRequest }: Props) {
  if (
    !graduationRequest.graduationClearances ||
    graduationRequest.graduationClearances.length === 0
  ) {
    return (
      <Card shadow='sm' padding='xl' radius='md' withBorder>
        <Stack align='center' gap='md'>
          <IconFileText size={48} />
          <Stack align='center' gap='xs'>
            <Text fw={500} size='lg' c='dimmed'>
              No Clearance Requirements
            </Text>
            <Text size='sm' c='dimmed' ta='center'>
              Your graduation request doesn&apos;t have any clearance
              requirements assigned yet.
            </Text>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      {graduationRequest.graduationClearances.map((item) => {
        const clearance = item.clearance;
        return (
          <Card withBorder key={clearance.id}>
            <Group justify='space-between' mb='xs'>
              <Group>
                <ThemeIcon
                  color={getStatusColor(clearance.status)}
                  variant='light'
                  size='sm'
                >
                  {getStatusIcon(clearance.status)}
                </ThemeIcon>
                <Text fw={500} size='sm' tt='capitalize'>
                  {clearance.department} Department
                </Text>
              </Group>
              <Badge
                color={getStatusColor(clearance.status)}
                variant='light'
                size='sm'
                tt='capitalize'
              >
                {clearance.status}
              </Badge>
            </Group>

            {clearance.message && (
              <Text size='xs' c='dimmed' mt='xs' fs='italic'>
                &quot;{clearance.message}&quot;
              </Text>
            )}

            <Text size='xs' c='dimmed' mt='sm'>
              Created: {formatDateTime(clearance.createdAt)}
            </Text>
            {clearance.responseDate && (
              <Text size='xs' c='dimmed'>
                Responded: {formatDateTime(clearance.responseDate)}
              </Text>
            )}
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
