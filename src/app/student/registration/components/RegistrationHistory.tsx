import { formatDateTime, formatSemester } from '@/lib/utils';
import { getStudentRegistrationHistory } from '@/server/registration-requests/actions';
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  CardSection,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCalendar,
  IconChevronRight,
  IconFileText,
} from '@tabler/icons-react';
import Link from 'next/link';
import { getStatusColor } from '../../utils/colors';
import ProofOfRegistrationDownload from './ProofOfRegistrationDownload';

interface RegistrationHistoryProps {
  stdNo: number;
}

export default async function RegistrationHistory({
  stdNo,
}: RegistrationHistoryProps) {
  const registrationHistory = await getStudentRegistrationHistory(stdNo);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      {registrationHistory.map((request) => {
        return (
          <Card
            withBorder
            key={request.id}
            component={Link}
            href={`/student/registration/${request.id}`}
          >
            <CardSection p='xs'>
              <Flex gap='xs' align='center' justify='space-between'>
                <Group>
                  <ThemeIcon variant='light' color='gray'>
                    <IconCalendar size={'1rem'} />
                  </ThemeIcon>
                  <Text fw={600} size='lg'>
                    {request.term.name}
                  </Text>
                </Group>
                <Badge
                  color={getStatusColor(request.status)}
                  variant='light'
                  size='sm'
                >
                  {request.status}
                </Badge>
              </Flex>
            </CardSection>

            <Flex justify={'space-between'} align={'center'}>
              <Box mt='xs'>
                <Text size='sm'>{formatSemester(request.semesterNumber)}</Text>
              </Box>
              {request.status === 'registered' && (
                <ProofOfRegistrationDownload
                  stdNo={stdNo}
                  termName={request.term.name}
                  semesterNumber={request.semesterNumber}
                />
              )}
            </Flex>

            <CardSection px='xs' mt='xs' py='xs' withBorder>
              <Flex gap='xs' align='center' justify='space-between'>
                <Text size='xs' c='dimmed' mt='xs'>
                  Submitted: {formatDateTime(request.createdAt)}
                </Text>
                <Group>
                  <Group gap='xs'>
                    <Text size='xs' c='dimmed' fw={500}>
                      View Details
                    </Text>
                    <ActionIcon variant='subtle' color='gray' size='sm'>
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Flex>
            </CardSection>
          </Card>
        );
      })}

      {registrationHistory.length === 0 && (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Stack align='center' gap='md'>
            <IconFileText size={48} />
            <Stack align='center' gap='xs'>
              <Text fw={500} size='lg' c='dimmed'>
                No Registration Requests
              </Text>
              <Text size='sm' c='dimmed' ta='center'>
                You haven&apos;t submitted any registration requests yet. Your
                registration history will appear here once you submit your first
                request.
              </Text>
            </Stack>
          </Stack>
        </Card>
      )}
    </SimpleGrid>
  );
}
