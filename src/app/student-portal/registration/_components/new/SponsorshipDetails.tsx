'use client';

import {
	findAllSponsors,
	getStudentCurrentSponsorship,
} from '@finance/sponsors';
import {
	ActionIcon,
	Alert,
	Button,
	Card,
	Group,
	LoadingOverlay,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import { getAlertColor } from '@/shared/lib/utils/colors';
import { ReceiptInput } from '@/shared/ui/adease';

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

interface SponsorshipDetailsProps {
	sponsorshipData: SponsorshipData | null;
	onSponsorshipChange: (data: SponsorshipData) => void;
	tuitionFeeReceipts: string[];
	onTuitionFeeReceiptsChange: (receipts: string[]) => void;
	loading: boolean;
}

export default function SponsorshipDetails({
	sponsorshipData,
	onSponsorshipChange,
	tuitionFeeReceipts,
	onTuitionFeeReceiptsChange,
	loading,
}: SponsorshipDetailsProps) {
	const { student } = useUserStudent();

	const [borrowerNo, setBorrowerNo] = useState(
		sponsorshipData?.borrowerNo || ''
	);
	const [bankName, setBankName] = useState(sponsorshipData?.bankName || '');
	const [accountNumber, setAccountNumber] = useState(
		sponsorshipData?.accountNumber || ''
	);

	const bankOptions = [
		{ value: 'SLB', label: 'Standard Lesotho Bank' },
		{ value: 'NED', label: 'NetBank' },
		{ value: 'FNB', label: 'First National Bank' },
		{ value: 'LPB', label: 'Lesotho Post Bank' },
	];

	const { data: sponsorsData, isLoading: sponsorsLoading } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, ''),
		select: (data) => data.items || [],
	});

	const { data: currentSponsorship } = useQuery({
		queryKey: ['student-sponsorship', student?.stdNo],
		queryFn: () => getStudentCurrentSponsorship(student!.stdNo),
		enabled: !!student?.stdNo,
	});

	const sponsors = sponsorsData || [];

	const isNMDS = useCallback(
		(sponsorId: number) => {
			if (!sponsors) return false;
			return sponsors.find((s) => s.id === sponsorId)?.name === 'NMDS';
		},
		[sponsors]
	);

	const isPRV = useCallback(
		(sponsorId: number) => {
			if (!sponsors) return false;
			return sponsors.find((s) => s.id === sponsorId)?.code === 'PRV';
		},
		[sponsors]
	);

	const handleAddTuitionReceipt = (value: string) => {
		if (value.trim() && !tuitionFeeReceipts.includes(value.trim())) {
			onTuitionFeeReceiptsChange([...tuitionFeeReceipts, value.trim()]);
		}
	};

	const handleRemoveTuitionReceipt = (index: number) => {
		onTuitionFeeReceiptsChange(
			tuitionFeeReceipts.filter((_, i) => i !== index)
		);
	};

	useEffect(() => {
		if (
			currentSponsorship &&
			sponsors.length > 0 &&
			!sponsorshipData?.sponsorId
		) {
			const sponsorId = currentSponsorship.sponsorId;
			const newBorrowerNo = currentSponsorship.borrowerNo || '';
			const newBankName = currentSponsorship.bankName || '';
			const newAccountNumber = currentSponsorship.accountNumber || '';

			setBorrowerNo(newBorrowerNo);
			setBankName(newBankName);
			setAccountNumber(newAccountNumber);

			onSponsorshipChange({
				sponsorId,
				borrowerNo: newBorrowerNo || undefined,
				bankName: newBankName || undefined,
				accountNumber: newAccountNumber || undefined,
			});
		}
	}, [
		currentSponsorship,
		sponsors,
		sponsorshipData?.sponsorId,
		onSponsorshipChange,
	]);

	const handleSponsorChange = (value: string | null) => {
		if (value) {
			const sponsorId = parseInt(value, 10);
			const selectedSponsor = sponsors.find((s) => s.id === sponsorId);

			let newBorrowerNo = borrowerNo;

			if (selectedSponsor?.name === 'NMDS' && currentSponsorship?.borrowerNo) {
				newBorrowerNo = currentSponsorship.borrowerNo;
				setBorrowerNo(newBorrowerNo);
			} else if (selectedSponsor?.name !== 'NMDS') {
				newBorrowerNo = '';
				setBorrowerNo('');
			}

			onSponsorshipChange({
				sponsorId,
				borrowerNo: newBorrowerNo || undefined,
				bankName: sponsorshipData?.bankName,
				accountNumber: sponsorshipData?.accountNumber,
			});
		}
	};

	const handleBorrowerNoChange = (value: string) => {
		setBorrowerNo(value);
		if (sponsorshipData) {
			onSponsorshipChange({
				...sponsorshipData,
				borrowerNo: value || undefined,
			});
		}
	};

	const handleBankNameChange = (value: string | null) => {
		const newBankName = value || '';
		setBankName(newBankName);
		if (sponsorshipData) {
			onSponsorshipChange({
				...sponsorshipData,
				bankName: newBankName || undefined,
			});
		}
	};

	const handleAccountNumberChange = (value: string) => {
		setAccountNumber(value);
		if (sponsorshipData) {
			onSponsorshipChange({
				...sponsorshipData,
				accountNumber: value || undefined,
			});
		}
	};

	const sponsorOptions = sponsors.map((sponsor) => ({
		value: sponsor.id.toString(),
		label: sponsor.name,
	}));

	if (loading) {
		return (
			<div style={{ position: 'relative', minHeight: 200 }}>
				<LoadingOverlay visible />
			</div>
		);
	}

	return (
		<Stack gap='lg' mt='md'>
			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Select
						label='Sponsor'
						placeholder='Select your sponsor'
						data={sponsorOptions}
						value={sponsorshipData?.sponsorId?.toString() || null}
						onChange={handleSponsorChange}
						required
						searchable
						disabled={sponsorsLoading}
					/>

					{sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId) && (
						<>
							<TextInput
								label='Borrower Number'
								placeholder='Enter your borrower number'
								value={borrowerNo}
								onChange={(event) =>
									handleBorrowerNoChange(event.currentTarget.value)
								}
								description='Required for NMDS sponsored students'
								required
							/>
							<Select
								label='Bank Name'
								placeholder='Select your bank'
								data={bankOptions}
								value={bankName || null}
								onChange={handleBankNameChange}
								searchable
								clearable
							/>

							<TextInput
								label='Account Number'
								placeholder='Enter your account number'
								value={accountNumber}
								onChange={(event) =>
									handleAccountNumberChange(event.currentTarget.value)
								}
							/>
						</>
					)}
				</Stack>
			</Paper>

			{sponsorshipData?.sponsorId && isPRV(sponsorshipData.sponsorId) && (
				<Paper p='lg' withBorder>
					<Stack gap='md'>
						<Title order={5}>Tuition Fee Payment Receipts</Title>
						<Text size='sm' c='dimmed'>
							As a self-sponsored student, please provide your tuition fee
							payment receipts.
						</Text>

						<ReceiptInputWithAdd onAdd={handleAddTuitionReceipt} />

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

			<Alert
				icon={<IconInfoCircle size='1rem' />}
				color={getAlertColor('info')}
			>
				<Text size='sm'>
					<strong>Important:</strong> Make sure your sponsorship details are
					correct. If you&apos;re unsure about your sponsor or borrower number,
					please contact the finance office.
				</Text>
			</Alert>

			{sponsors.length === 0 && !sponsorsLoading && (
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					color={getAlertColor('warning')}
				>
					No sponsors found. Please contact the administration to set up
					sponsors.
				</Alert>
			)}
		</Stack>
	);
}

type ReceiptInputWithAddProps = {
	onAdd: (value: string) => void;
};

function ReceiptInputWithAdd({ onAdd }: ReceiptInputWithAddProps) {
	const [value, setValue] = useState('');

	const handleAdd = () => {
		if (value.trim()) {
			onAdd(value.trim());
			setValue('');
		}
	};

	return (
		<Group gap='sm' align='flex-end'>
			<div style={{ flex: 1 }}>
				<ReceiptInput
					label='Receipt Number'
					value={value}
					onChange={setValue}
				/>
			</div>
			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={handleAdd}
				disabled={!value.trim()}
			>
				Add
			</Button>
		</Group>
	);
}
