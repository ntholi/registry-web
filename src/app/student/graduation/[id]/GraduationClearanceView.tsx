import { getStatusColor } from '@/app/student/utils/colors';
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
import { IconCheck, IconClock, IconFileText, IconX } from '@tabler/icons-react';

interface GraduationClearanceViewProps {
  graduationRequest: any; // You might want to type this properly based on your graduation request type
}

export default function GraduationClearanceView({
  graduationRequest,
}: GraduationClearanceViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <IconCheck size='1rem' />;
      case 'rejected':
        return <IconX size='1rem' />;
      default:
        return <IconClock size='1rem' />;
    }
  };

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
      {graduationRequest.graduationClearances.map((item: any) => {
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
                <Text fw={500} size='sm'>
                  {clearance.department}
                </Text>
              </Group>
              <Badge
                color={getStatusColor(clearance.status)}
                variant='light'
                size='sm'
              >
                {clearance.status}
              </Badge>
            </Group>

            <Text size='xs' c='dimmed'>
              {clearance.description}
            </Text>

            {clearance.comment && (
              <Text size='xs' c='dimmed' mt='xs' fs='italic'>
                &quot;{clearance.comment}&quot;
              </Text>
            )}

            <Text size='xs' c='dimmed' mt='sm'>
              Last updated: {formatDateTime(clearance.updatedAt)}
            </Text>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
