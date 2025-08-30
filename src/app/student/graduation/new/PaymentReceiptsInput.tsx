'use client';

import { paymentTypeEnum } from '@/db/schema';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCurrencyDollar,
  IconPlus,
  IconReceipt,
  IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';

type PaymentReceiptData = {
  paymentType: (typeof paymentTypeEnum)[number] | null;
  receiptNo: string;
};

interface Props {
  paymentReceipts: PaymentReceiptData[];
  onPaymentReceiptsChange: (receipts: PaymentReceiptData[] | null) => void;
}

export default function PaymentReceiptsInput({
  paymentReceipts,
  onPaymentReceiptsChange,
}: Props) {
  const [newPayment, setNewPayment] = useState<PaymentReceiptData>();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const paymentTypeOptions = paymentTypeEnum.map((type) => ({
    value: type,
    label: type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  const addPaymentReceipt = () => {
    if (newPayment?.receiptNo?.trim() && newPayment?.paymentType) {
      onPaymentReceiptsChange([
        ...paymentReceipts,
        newPayment as PaymentReceiptData,
      ]);
      setNewPayment(undefined);
    }
  };

  const removePaymentReceipt = (index: number) => {
    const updated = paymentReceipts.filter((_, i) => i !== index);
    onPaymentReceiptsChange(updated);
  };

  const updateNewPayment = (
    field: keyof PaymentReceiptData,
    value: string | null
  ) => {
    setNewPayment((prev) => ({
      paymentType: null,
      receiptNo: '',
      ...prev,
      [field]: value,
    }));
  };

  const isAddDisabled =
    !newPayment?.receiptNo?.trim() || !newPayment?.paymentType;

  return (
    <Stack gap='lg'>
      <Card withBorder shadow='sm' radius='md' padding='lg'>
        <Group mb='md'>
          <IconPlus size='1.5rem' />
          <Title order={3}>Add Payment Receipt</Title>
        </Group>

        <Text mb='lg' c='dimmed'>
          Enter the receipt details for your graduation-related payments.
        </Text>

        <SimpleGrid cols={isMobile ? 1 : 2} spacing='md'>
          <Select
            label='Payment Type'
            placeholder='Select payment type'
            value={newPayment?.paymentType || null}
            onChange={(value) => updateNewPayment('paymentType', value)}
            data={paymentTypeOptions}
            required
            leftSection={<IconCurrencyDollar size='1rem' />}
          />

          <TextInput
            label='Receipt Number'
            placeholder='Enter receipt number'
            value={newPayment?.receiptNo || ''}
            onChange={(event) =>
              updateNewPayment('receiptNo', event.currentTarget.value)
            }
            required
          />
        </SimpleGrid>

        <Group justify='flex-end' mt='lg'>
          <Button
            leftSection={<IconPlus size='1rem' />}
            onClick={addPaymentReceipt}
            disabled={isAddDisabled}
          >
            Add Receipt
          </Button>
        </Group>
      </Card>

      {paymentReceipts.length > 0 && (
        <Card withBorder shadow='sm' radius='md' padding='lg'>
          <Group mb='md' justify='space-between'>
            <Group>
              <IconReceipt size='1.5rem' />
              <Title order={3}>Payment Receipts</Title>
              <Badge color='blue' size='sm'>
                {paymentReceipts.length}
              </Badge>
            </Group>
          </Group>

          <Text mb='lg' c='dimmed'>
            Your added payment receipts. Click the trash icon to remove any
            receipt.
          </Text>

          <Stack gap='md'>
            {paymentReceipts.map((receipt, index) => (
              <Paper key={index} withBorder p='md'>
                {isMobile ? (
                  <Stack gap='sm'>
                    <Group justify='space-between' align='center'>
                      <Text size='sm' fw={500}>
                        {
                          paymentTypeOptions.find(
                            (option) => option.value === receipt.paymentType
                          )?.label
                        }
                      </Text>
                      <ActionIcon
                        color='red'
                        variant='subtle'
                        onClick={() => removePaymentReceipt(index)}
                        title='Remove receipt'
                      >
                        <IconTrash size='1rem' />
                      </ActionIcon>
                    </Group>
                    <Box>
                      <Text size='xs' c='dimmed' mb={2}>
                        Receipt Number
                      </Text>
                      <Text size='sm'>{receipt.receiptNo}</Text>
                    </Box>
                  </Stack>
                ) : (
                  <Group justify='space-between' align='center'>
                    <Group gap='lg' style={{ flex: 1 }}>
                      <Box>
                        <Text size='xs' c='dimmed' mb={2}>
                          Payment Type
                        </Text>
                        <Text size='sm' fw={500}>
                          {
                            paymentTypeOptions.find(
                              (option) => option.value === receipt.paymentType
                            )?.label
                          }
                        </Text>
                      </Box>
                      <Box>
                        <Text size='xs' c='dimmed' mb={2}>
                          Receipt Number
                        </Text>
                        <Text size='sm'>{receipt.receiptNo}</Text>
                      </Box>
                    </Group>
                    <ActionIcon
                      color='red'
                      variant='subtle'
                      onClick={() => removePaymentReceipt(index)}
                      title='Remove receipt'
                    >
                      <IconTrash size='1rem' />
                    </ActionIcon>
                  </Group>
                )}
              </Paper>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
