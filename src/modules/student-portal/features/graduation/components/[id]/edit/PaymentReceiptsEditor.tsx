'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Loader,
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
import { notifications } from '@mantine/notifications';
import {
	IconCurrencyDollar,
	IconPlus,
	IconReceipt,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentType } from '@/core/database/schema';
import {
	addPaymentReceipt,
	removePaymentReceipt,
} from '@/modules/finance/features/payment-receipts/server/actions';

type PaymentReceipt = {
	id: number;
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
	createdAt: Date | null;
};

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

interface Props {
	graduationRequestId: number;
	paymentReceipts: PaymentReceipt[];
}

export default function PaymentReceiptsEditor({
	graduationRequestId,
	paymentReceipts,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const queryClient = useQueryClient();

	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
			paymentType: '',
			receiptNo: '',
		},
		validate: {
			paymentType: (value) => (value ? null : 'Payment type is required'),
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

	const paymentTypeOptions = paymentType.enumValues.map((type) => ({
		value: type,
		label: type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' '),
	}));

	const { mutate: addReceipt, isPending: isAdding } = useMutation({
		mutationFn: async (receiptData: PaymentReceiptData) => {
			return addPaymentReceipt(graduationRequestId, receiptData);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Payment receipt added successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['graduation-request', graduationRequestId],
			});
			form.reset();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add payment receipt',
				color: 'red',
			});
		},
	});

	const { mutate: deleteReceipt, isPending: isDeleting } = useMutation({
		mutationFn: async (receiptId: number) => {
			return removePaymentReceipt(receiptId);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Payment receipt removed successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['graduation-request', graduationRequestId],
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to remove payment receipt',
				color: 'red',
			});
		},
	});

	const handleAddReceipt = (values: typeof form.values) => {
		// Check if receipt already exists for the same payment type
		const existingReceipt = paymentReceipts.find(
			(receipt) => receipt.paymentType === values.paymentType
		);

		if (existingReceipt) {
			form.setFieldError(
				'paymentType',
				'A receipt for this payment type already exists'
			);
			return;
		}

		addReceipt({
			paymentType:
				values.paymentType as (typeof paymentType.enumValues)[number],
			receiptNo: values.receiptNo,
		});
	};

	const handleDeleteReceipt = (receiptId: number) => {
		deleteReceipt(receiptId);
	};

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

	return (
		<Stack gap='lg'>
			<Card withBorder shadow='sm' radius='md' padding='lg'>
				<Text mb='lg' c='dimmed'>
					Enter the receipt details for your graduation-related payments.
				</Text>

				<form onSubmit={form.onSubmit(handleAddReceipt)}>
					<SimpleGrid cols={isMobile ? 1 : 2} spacing='md'>
						<Select
							label='Payment Type'
							placeholder='Select payment type'
							data={paymentTypeOptions}
							required
							leftSection={<IconCurrencyDollar size='1rem' />}
							{...form.getInputProps('paymentType')}
						/>

						<TextInput
							label='Receipt Number'
							placeholder='Enter receipt number'
							required
							{...form.getInputProps('receiptNo')}
						/>
					</SimpleGrid>

					<Group justify='flex-end' mt='lg'>
						<Button
							leftSection={
								isAdding ? <Loader size='xs' /> : <IconPlus size='1rem' />
							}
							type='submit'
							loading={isAdding}
							disabled={isAdding || isDeleting}
						>
							Add Receipt
						</Button>
					</Group>
				</form>
			</Card>

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

				{paymentReceipts.length === 0 ? (
					<Paper withBorder bg='var(--mantine-color-gray-light)' p='xl'>
						<Stack align='center' gap='md'>
							<IconReceipt size={48} />
							<Stack align='center' gap='xs'>
								<Text fw={500} size='lg' c='dimmed'>
									No Payment Receipts
								</Text>
								<Text size='sm' c='dimmed' ta='center'>
									Add your payment receipts using the form above.
								</Text>
							</Stack>
						</Stack>
					</Paper>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						{paymentReceipts.map((receipt) => (
							<Paper key={receipt.id} withBorder p='md'>
								<Group justify='space-between' align='flex-start'>
									<Box style={{ flex: 1 }}>
										<Group mb='xs'>
											<Badge
												color={getPaymentTypeColor(receipt.paymentType)}
												variant='light'
												leftSection={<IconReceipt size='0.8rem' />}
											>
												{getPaymentTypeLabel(receipt.paymentType)}
											</Badge>
										</Group>

										<Text size='sm' c='dimmed' mb='xs'>
											Receipt No:{' '}
											<Text span fw={500} c='dark'>
												{receipt.receiptNo}
											</Text>
										</Text>

										<Text size='xs' c='dimmed'>
											Added:{' '}
											{receipt.createdAt
												? new Date(receipt.createdAt).toLocaleDateString()
												: 'Unknown'}
										</Text>
									</Box>

									<ActionIcon
										color='red'
										variant='subtle'
										onClick={() => handleDeleteReceipt(receipt.id)}
										title='Remove receipt'
										loading={isDeleting}
										disabled={isDeleting || isAdding}
									>
										<IconTrash size='1rem' />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</SimpleGrid>
				)}
			</Card>
		</Stack>
	);
}
