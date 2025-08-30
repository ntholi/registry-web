'use client';

import React from 'react';
import { students, paymentTypeEnum } from '@/db/schema';
import {
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconUser,
  IconId,
  IconGenderMale,
  IconGenderFemale,
  IconReceipt,
  IconCheck,
} from '@tabler/icons-react';

type Student = typeof students.$inferSelect & {
  user?: { name?: string | null } | null;
};

type PaymentReceiptData = {
  paymentType: (typeof paymentTypeEnum)[number];
  receiptNo: string;
};

interface ReviewAndSubmitProps {
  student: Student;
  paymentReceipts: PaymentReceiptData[];
  loading?: boolean;
}

export default function ReviewAndSubmit({
  student,
  paymentReceipts,
  loading = false,
}: ReviewAndSubmitProps) {
  const formatPaymentType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Box pos='relative'>
      <LoadingOverlay visible={loading} />

      <Stack gap='lg'>
        <Text size='lg' c='dimmed' ta='center'>
          Please review your information before submitting your graduation
          request.
        </Text>

        {/* Personal Information Review */}
        <Card withBorder shadow='sm' radius='md' padding='lg'>
          <Group mb='md'>
            <IconCheck size='1.2rem' color='green' />
            <Title order={3}>Personal Information</Title>
            <Badge color='green' variant='light'>
              Confirmed
            </Badge>
          </Group>

          <Stack gap='sm'>
            <Group>
              <IconUser size='1rem' color='gray' />
              <Text size='sm' c='dimmed' w={120}>
                Name:
              </Text>
              <Text fw={500}>{student.user?.name || student.name}</Text>
            </Group>

            <Group>
              <IconId size='1rem' color='gray' />
              <Text size='sm' c='dimmed' w={120}>
                National ID:
              </Text>
              <Text fw={500}>{student.nationalId || 'Not provided'}</Text>
            </Group>

            <Group>
              {student.gender === 'Male' ? (
                <IconGenderMale size='1rem' color='blue' />
              ) : (
                <IconGenderFemale size='1rem' color='pink' />
              )}
              <Text size='sm' c='dimmed' w={120}>
                Gender:
              </Text>
              <Text fw={500}>{student.gender || 'Not specified'}</Text>
            </Group>

            <Group>
              <IconId size='1rem' color='gray' />
              <Text size='sm' c='dimmed' w={120}>
                Student No:
              </Text>
              <Text fw={500}>{student.stdNo}</Text>
            </Group>
          </Stack>
        </Card>

        {/* Payment Receipts Review */}
        <Card withBorder shadow='sm' radius='md' padding='lg'>
          <Group mb='md'>
            <IconReceipt size='1.2rem' />
            <Title order={3}>Payment Receipts</Title>
            <Badge color='blue' variant='light'>
              {paymentReceipts.length} Receipt
              {paymentReceipts.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          <Stack gap='md'>
            {paymentReceipts.map((receipt, index) => (
              <Card key={index} padding='sm' bg='gray.0' withBorder>
                <Group justify='space-between' align='center'>
                  <Box>
                    <Text fw={500} size='sm'>
                      {formatPaymentType(receipt.paymentType)}
                    </Text>
                    <Text size='xs' c='dimmed'>
                      Receipt Number
                    </Text>
                  </Box>

                  <Badge variant='outline' size='lg'>
                    {receipt.receiptNo}
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        </Card>

        {/* Submission Summary */}
        <Card withBorder shadow='sm' radius='md' padding='lg' bg='blue.0'>
          <Title order={4} mb='md' c='blue.7'>
            What happens next?
          </Title>

          <Stack gap='sm'>
            <Group>
              <Text size='sm' fw={500} c='blue.7'>
                1.
              </Text>
              <Text size='sm' c='blue.7'>
                Your graduation request will be submitted to the Registry
                Department
              </Text>
            </Group>

            <Group>
              <Text size='sm' fw={500} c='blue.7'>
                2.
              </Text>
              <Text size='sm' c='blue.7'>
                Various departments will review and approve your clearance
              </Text>
            </Group>

            <Group>
              <Text size='sm' fw={500} c='blue.7'>
                3.
              </Text>
              <Text size='sm' c='blue.7'>
                You will be notified once all clearances are completed
              </Text>
            </Group>

            <Group>
              <Text size='sm' fw={500} c='blue.7'>
                4.
              </Text>
              <Text size='sm' c='blue.7'>
                You can track the status of your clearance request online
              </Text>
            </Group>
          </Stack>
        </Card>

        <Divider />

        <Text size='sm' c='dimmed' ta='center'>
          By submitting this request, you confirm that all information provided
          is accurate and complete. Click "Submit Graduation Request" to
          proceed.
        </Text>
      </Stack>
    </Box>
  );
}
