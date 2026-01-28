'use client';

import { findAllSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Grid,
	GridCol,
	Group,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ReceiptInput } from '@/shared/ui/adease';

interface SponsorInputProps {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
	onSponsorChange: (sponsorId: number) => void;
	onBorrowerNoChange: (borrowerNo: string) => void;
	onBankNameChange: (bankName: string) => void;
	onAccountNumberChange: (accountNumber: string) => void;
	tuitionFeeReceipts?: string[];
	onTuitionFeeReceiptsChange?: (receipts: string[]) => void;
	onReceiptValidationChange?: (isValid: boolean) => void;
	disabled?: boolean;
}

export default function SponsorInput({
	sponsorId,
	borrowerNo,
	bankName,
	accountNumber,
	onSponsorChange,
	onBorrowerNoChange,
	onBankNameChange,
	onAccountNumberChange,
	tuitionFeeReceipts = [],
	onTuitionFeeReceiptsChange,
	onReceiptValidationChange,
	disabled,
}: SponsorInputProps) {
	const [receiptValue, setReceiptValue] = useState('');

	const { data: sponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1),
		select: ({ items }) => items,
	});

	const bankOptions = [
		{ value: 'SLB', label: 'Standard Lesotho Bank' },
		{ value: 'NED', label: 'NetBank' },
		{ value: 'FNB', label: 'First National Bank' },
		{ value: 'LPB', label: 'Lesotho Post Bank' },
	];

	const isNMDS = (id: number) => {
		if (!sponsors) return false;
		return id === sponsors.find((s) => s.name === 'NMDS')?.id;
	};

	const isPRV = (id: number) => {
		if (!sponsors) return false;
		return sponsors.find((s) => s.id === id)?.code === 'PRV';
	};

	const requiresReceipt = sponsorId && isPRV(sponsorId);
	const hasValidReceipts = tuitionFeeReceipts.filter(Boolean).length > 0;

	useEffect(() => {
		const isValid = !requiresReceipt || hasValidReceipts;
		onReceiptValidationChange?.(isValid);
	}, [requiresReceipt, hasValidReceipts, onReceiptValidationChange]);

	const handleAddTuitionReceipt = () => {
		if (
			receiptValue.trim() &&
			!tuitionFeeReceipts.includes(receiptValue.trim())
		) {
			onTuitionFeeReceiptsChange?.([
				...tuitionFeeReceipts,
				receiptValue.trim(),
			]);
			setReceiptValue('');
		}
	};

	const handleRemoveTuitionReceipt = (index: number) => {
		onTuitionFeeReceiptsChange?.(
			tuitionFeeReceipts.filter((_, i) => i !== index)
		);
	};

	return (
		<Stack gap='md'>
			<Paper withBorder p='md'>
				<Text fw={500} mb='sm'>
					Sponsorship Information
				</Text>
				<Grid>
					<GridCol span={6}>
						<Select
							label='Sponsor'
							data={
								sponsors?.map((sponsor) => ({
									value: sponsor.id.toString(),
									label: sponsor.name,
								})) || []
							}
							value={sponsorId?.toString()}
							onChange={(value: string | null) => {
								onSponsorChange(Number(value));
							}}
							placeholder='Select sponsor'
							clearable
							disabled={disabled}
							required
						/>
					</GridCol>
					<GridCol span={6}>
						<TextInput
							label='Borrower Number'
							value={borrowerNo}
							onChange={(e) => onBorrowerNoChange(e.currentTarget.value)}
							disabled={!(sponsorId && isNMDS(sponsorId)) || disabled}
						/>
					</GridCol>
					<GridCol span={6}>
						<Select
							label='Bank Name'
							placeholder='Select bank'
							data={bankOptions}
							value={bankName || null}
							onChange={(value: string | null) => onBankNameChange(value || '')}
							disabled={disabled}
							searchable
							clearable
						/>
					</GridCol>
					<GridCol span={6}>
						<TextInput
							label='Account Number'
							value={accountNumber || ''}
							onChange={(e) => onAccountNumberChange(e.currentTarget.value)}
							disabled={disabled}
						/>
					</GridCol>
				</Grid>
			</Paper>

			{sponsorId && isPRV(sponsorId) && (
				<Paper withBorder p='md'>
					<Stack gap='md'>
						<div>
							<Title order={5}>Payment Receipt</Title>
							<Text size='sm' c='dimmed'>
								Tuition fee payment receipts (required).
							</Text>
						</div>

						<Group align='flex-end'>
							<Box style={{ flex: 1 }}>
								<ReceiptInput
									label='Receipt Number'
									value={receiptValue}
									onChange={setReceiptValue}
								/>
							</Box>
							<Button
								variant='light'
								leftSection={<IconPlus size={16} />}
								onClick={handleAddTuitionReceipt}
								disabled={!receiptValue.trim()}
							>
								Add
							</Button>
						</Group>

						{tuitionFeeReceipts.filter(Boolean).length > 0 && (
							<SimpleGrid cols={{ base: 1, sm: 3 }} spacing='sm'>
								{tuitionFeeReceipts.filter(Boolean).map((receipt, index) => (
									<Card
										key={index}
										withBorder
										padding='lg'
										style={{ position: 'relative' }}
									>
										<Group justify='space-between' wrap='nowrap'>
											<Text size='sm' fw={500} truncate>
												{receipt}
											</Text>
											<ActionIcon
												color='red'
												variant='subtle'
												size='sm'
												onClick={() => handleRemoveTuitionReceipt(index)}
											>
												<IconTrash size={14} />
											</ActionIcon>
										</Group>
									</Card>
								))}
							</SimpleGrid>
						)}
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
