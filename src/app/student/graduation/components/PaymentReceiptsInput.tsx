'use client';

import React from 'react';
import { paymentTypeEnum } from '@/db/schema';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconReceipt,
  IconCurrencyDollar,
} from '@tabler/icons-react';

type PaymentReceiptData = {
  paymentType: (typeof paymentTypeEnum)[number];
  receiptNo: string;
};

interface PaymentReceiptsInputProps {
  paymentReceipts: PaymentReceiptData[];
  onPaymentReceiptsChange: (receipts: PaymentReceiptData[]) => void;
}

export default function PaymentReceiptsInput({
  paymentReceipts,
  onPaymentReceiptsChange,
}: PaymentReceiptsInputProps) {
  const paymentTypeOptions = paymentTypeEnum.map((type) => ({
    value: type,
    label: type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));

  const addPaymentReceipt = () => {
    onPaymentReceiptsChange([
      ...paymentReceipts,
      { paymentType: 'graduation_fee', receiptNo: '' },
    ]);
  };

  const removePaymentReceipt = (index: number) => {
    const updated = paymentReceipts.filter((_, i) => i !== index);
    onPaymentReceiptsChange(updated);
  };

  const updatePaymentReceipt = (
    index: number,
    field: keyof PaymentReceiptData,
    value: string
  ) => {
    const updated = paymentReceipts.map((receipt, i) =>
      i === index ? { ...receipt, [field]: value } : receipt
    );
    onPaymentReceiptsChange(updated);
  };

  return (
    <Stack gap='lg'>
      <Card withBorder shadow='sm' radius='md' padding='lg'>
        <Group mb='md'>
          <IconReceipt size='1.5rem' />
          <Title order={3}>Payment Receipts</Title>
        </Group>

        <Text mb='lg' c='dimmed'>
          Enter the receipt numbers for your graduation-related payments. You
          can add multiple receipts if you made separate payments.
        </Text>

        <Stack gap='md'>
          {paymentReceipts.map((receipt, index) => (
            <Card key={index} withBorder padding='md' bg='gray.0'>
              <Group align='flex-start' gap='md'>
                <Box flex={1}>
                  <Group align='flex-end' gap='md' grow>
                    <Select
                      label='Payment Type'
                      placeholder='Select payment type'
                      value={receipt.paymentType}
                      onChange={(value) =>
                        updatePaymentReceipt(
                          index,
                          'paymentType',
                          value as (typeof paymentTypeEnum)[number]
                        )
                      }
                      data={paymentTypeOptions}
                      required
                      leftSection={<IconCurrencyDollar size='1rem' />}
                    />

                    <TextInput
                      label='Receipt Number'
                      placeholder='Enter receipt number'
                      value={receipt.receiptNo}
                      onChange={(event) =>
                        updatePaymentReceipt(
                          index,
                          'receiptNo',
                          event.currentTarget.value
                        )
                      }
                      required
                    />

                    <ActionIcon
                      color='red'
                      onClick={() => removePaymentReceipt(index)}
                      disabled={paymentReceipts.length === 1}
                      title='Remove receipt'
                    >
                      <IconTrash size='1rem' />
                    </ActionIcon>
                  </Group>
                </Box>
              </Group>
            </Card>
          ))}

          <Button
            variant='light'
            leftSection={<IconPlus size='1rem' />}
            onClick={addPaymentReceipt}
            mt='md'
          >
            Add Another Receipt
          </Button>
        </Stack>

        {paymentReceipts.length === 0 && (
          <Box mt='lg'>
            <Text ta='center' c='dimmed' mb='md'>
              No payment receipts added yet
            </Text>
            <Group justify='center'>
              <Button
                leftSection={<IconPlus size='1rem' />}
                onClick={addPaymentReceipt}
              >
                Add First Receipt
              </Button>
            </Group>
          </Box>
        )}
      </Card>

      {/* Validation Summary */}
      {paymentReceipts.length > 0 && (
        <Card withBorder shadow='sm' radius='md' padding='md' bg='blue.0'>
          <Group gap='sm'>
            <IconReceipt size='1rem' color='blue' />
            <Text size='sm' c='blue.7'>
              {paymentReceipts.length} receipt
              {paymentReceipts.length !== 1 ? 's' : ''} added
              {paymentReceipts.some((r) => !r.receiptNo.trim()) &&
                ' (some incomplete)'}
            </Text>
          </Group>
        </Card>
      )}
    </Stack>
  );
}
