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
import { IconFileText, IconReceipt } from '@tabler/icons-react';

interface PaymentReceiptsViewProps {
  graduationRequest: any; // You might want to type this properly based on your graduation request type
}

export default function PaymentReceiptsView({
  graduationRequest,
}: PaymentReceiptsViewProps) {
  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'graduation_gown':
        return 'violet';
      case 'graduation_fee':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'graduation_gown':
        return 'Graduation Gown';
      case 'graduation_fee':
        return 'Graduation Fee';
      default:
        return type;
    }
  };

  if (
    !graduationRequest.paymentReceipts ||
    graduationRequest.paymentReceipts.length === 0
  ) {
    return (
      <Card shadow='sm' padding='xl' radius='md' withBorder>
        <Stack align='center' gap='md'>
          <IconFileText size={48} />
          <Stack align='center' gap='xs'>
            <Text fw={500} size='lg' c='dimmed'>
              No Payment Receipts
            </Text>
            <Text size='sm' c='dimmed' ta='center'>
              No payment receipts have been submitted for this graduation
              request yet.
            </Text>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      {graduationRequest.paymentReceipts.map((receipt: any) => (
        <Card withBorder key={receipt.id}>
          <Group justify='space-between' mb='xs'>
            <Group>
              <ThemeIcon
                color={getPaymentTypeColor(receipt.paymentType)}
                variant='light'
                size='sm'
              >
                <IconReceipt size='1rem' />
              </ThemeIcon>
              <Text fw={500} size='sm'>
                {getPaymentTypeLabel(receipt.paymentType)}
              </Text>
            </Group>
            <Badge
              color={getPaymentTypeColor(receipt.paymentType)}
              variant='light'
              size='sm'
            >
              Paid
            </Badge>
          </Group>

          <Text size='sm' c='dimmed' mb='xs'>
            Receipt No:{' '}
            <Text span fw={500}>
              {receipt.receiptNo}
            </Text>
          </Text>

          <Text size='xs' c='dimmed'>
            Submitted: {formatDateTime(receipt.createdAt)}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
