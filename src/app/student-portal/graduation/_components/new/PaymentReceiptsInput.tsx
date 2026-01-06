'use client';

import type { ReceiptType } from '@finance/_database';
import { receiptType } from '@finance/_database';
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
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import {
	IconCurrencyDollar,
	IconPlus,
	IconReceipt,
	IconTrash,
} from '@tabler/icons-react';

type PaymentReceiptData = {
	receiptType: (typeof receiptType.enumValues)[number];
	receiptNo: string;
};

interface Props {
	paymentReceipts: PaymentReceiptData[];
	onPaymentReceiptsChange: (receipts: PaymentReceiptData[]) => void;
}

export default function PaymentReceiptsInput({
	paymentReceipts,
	onPaymentReceiptsChange,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');

	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
			receiptType: '',
			receiptNo: '',
		},
		validate: {
			receiptType: (value) => (value ? null : 'Receipt type is required'),
			receiptNo: (value) => {
				if (!value?.trim()) {
					return 'Receipt number is required';
				}
				const receiptPattern = /^SR-\d{5}$/;
				if (!receiptPattern.test(value.trim())) {
					return 'Receipt number must be in format SR-##### (e.g., SR-12345)';
				}
				return null;
			},
		},
	});

	const receiptTypeOptions = receiptType.enumValues
		.filter((type) => type === 'graduation_gown' || type === 'graduation_fee')
		.map((type: (typeof receiptType.enumValues)[number]) => ({
			value: type,
			label: type
				.split('_')
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' '),
		}));

	const addPaymentReceipt = (values: typeof form.values) => {
		onPaymentReceiptsChange([
			...paymentReceipts,
			{
				receiptType:
					values.receiptType as (typeof receiptType.enumValues)[number],
				receiptNo: values.receiptNo,
			},
		]);
		form.setValues({
			receiptType: '',
			receiptNo: '',
		});
	};

	const removePaymentReceipt = (index: number) => {
		const updated = paymentReceipts.filter((_, i) => i !== index);
		onPaymentReceiptsChange(updated);
	};

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

				<form onSubmit={form.onSubmit(addPaymentReceipt)}>
					<SimpleGrid cols={isMobile ? 1 : 2} spacing='md'>
						<Select
							label='Receipt Type'
							placeholder='Select receipt type'
							data={receiptTypeOptions}
							required
							leftSection={<IconCurrencyDollar size='1rem' />}
							{...form.getInputProps('receiptType')}
						/>

						<TextInput
							label='Receipt Number'
							placeholder='Enter receipt number'
							required
							{...form.getInputProps('receiptNo')}
						/>
					</SimpleGrid>

					<Group justify='flex-end' mt='lg'>
						<Button leftSection={<IconPlus size='1rem' />} type='submit'>
							Add Receipt
						</Button>
					</Group>
				</form>
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
							<Paper
								key={`${receipt.receiptType}-${receipt.receiptNo}`}
								withBorder
								p='md'
							>
								{isMobile ? (
									<Stack gap='sm'>
										<Group justify='space-between' align='center'>
											<Text size='sm' fw={500}>
												{
													receiptTypeOptions.find(
														(option: { value: ReceiptType }) =>
															option.value === receipt.receiptType
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
													Receipt Type
												</Text>
												<Text size='sm' fw={500}>
													{
														receiptTypeOptions.find(
															(option: { value: ReceiptType }) =>
																option.value === receipt.receiptType
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
