'use client';

import { toTitleCase } from '@/lib/utils';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { Alert, Badge, Box, Divider, Stack, Text } from '@mantine/core';
import { IconInfoCircle, IconExclamationCircle } from '@tabler/icons-react';

type Props = {
  registration: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function DepartmentMessagesView({ registration }: Props) {
  const { clearances = [] } = registration;

  const rejectedClearances = clearances.filter(
    (c) => c.clearance.status === 'rejected'
  );

  if (rejectedClearances.length === 0 && registration.message) {
    return (
      <>
        <Divider my='sm' />
        <Alert
          icon={<IconInfoCircle size='1rem' />}
          color='blue'
          variant='light'
          title='Message'
        >
          {registration.message}
        </Alert>
      </>
    );
  }

  if (rejectedClearances.length === 0) return null;

  return (
    <>
      <Divider my='sm' />
      <Alert
        icon={<IconExclamationCircle size='1rem' />}
        color='red'
        variant='light'
        title='Registration Rejected'
      >
        <Stack gap='xs'>
          {rejectedClearances.map((clearanceMapping) => {
            const { clearance } = clearanceMapping;

            return (
              <Box key={clearance.id}>
                <Badge color='red' variant='filled' size='sm'>
                  {toTitleCase(clearance.department)} Department
                </Badge>
                {clearance.message ? (
                  <Text size='sm'>{clearance.message}</Text>
                ) : (
                  <Text size='sm' c='dimmed' fs='italic'>
                    Rejected without specific message.
                  </Text>
                )}
                {rejectedClearances.length > 1 &&
                  clearanceMapping !==
                    rejectedClearances[rejectedClearances.length - 1] && (
                    <Divider mt='sm' />
                  )}
              </Box>
            );
          })}
        </Stack>
      </Alert>
    </>
  );
}
