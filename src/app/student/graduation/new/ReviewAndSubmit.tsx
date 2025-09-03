'use client';

import { paymentTypeEnum, students } from '@/db/schema';
import {
  Badge,
  Box,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconCheck,
  IconGenderFemale,
  IconGenderMale,
  IconId,
  IconReceipt,
  IconUser,
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
        <Card withBorder shadow='sm' radius='md' padding='lg'>
          <Group mb='md'>
            <IconCheck size='1.2rem' color='green' />
            <Title order={3}>Personal Information</Title>
          </Group>

          <Stack gap='sm'>
            <Group>
              <IconUser size='1rem' color='gray' />
              <Text size='sm' c='dimmed' w={120}>
                Name:
              </Text>
              <Text fw={500}>{student.name}</Text>
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
                <IconGenderMale size='1rem' color='gray' />
              ) : (
                <IconGenderFemale size='1rem' color='gray' />
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
              <Paper key={index} p='sm' withBorder>
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
              </Paper>
            ))}
          </Stack>
        </Card>

        <Divider />

        <Text size='sm' c='dimmed' ta='center'>
          By submitting this request, you confirm that all information provided
          is accurate and complete. Click &quot;Submit Graduation Request&quot;
          to proceed.
        </Text>
      </Stack>
    </Box>
  );
}
