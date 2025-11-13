import {
	Alert,
	Card,
	LoadingOverlay,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
	findAllSponsors,
	getSponsoredStudent,
} from '@/modules/finance/features/sponsors/server/actions';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

interface SponsorshipDetailsProps {
	sponsorshipData: SponsorshipData | null;
	onSponsorshipChange: (data: SponsorshipData) => void;
	loading: boolean;
}

export default function SponsorshipDetails({
	sponsorshipData,
	onSponsorshipChange,
	loading,
}: SponsorshipDetailsProps) {
	const { student } = useUserStudent();
	const { currentTerm } = useCurrentTerm();

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

	const { data: previousSponsorshipData } = useQuery({
		queryKey: ['previous-sponsorship', student?.stdNo, currentTerm?.id],
		queryFn: () => getSponsoredStudent(student!.stdNo, currentTerm!.id),
		enabled: !!student?.stdNo && !!currentTerm?.id,
	});

	const sponsors = sponsorsData || [];

	const isNMDS = useCallback(
		(sponsorId: number) => {
			if (!sponsors) return false;
			return sponsors.find((s) => s.id === sponsorId)?.name === 'NMDS';
		},
		[sponsors]
	);

	useEffect(() => {
		if (sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId)) {
			if (previousSponsorshipData?.borrowerNo && !borrowerNo) {
				setBorrowerNo(previousSponsorshipData.borrowerNo);
				onSponsorshipChange({
					sponsorId: sponsorshipData.sponsorId,
					borrowerNo: previousSponsorshipData.borrowerNo,
					bankName: sponsorshipData.bankName,
					accountNumber: sponsorshipData.accountNumber,
				});
			}
		}
	}, [
		sponsorshipData?.sponsorId,
		previousSponsorshipData?.borrowerNo,
		borrowerNo,
		isNMDS,
		onSponsorshipChange,
		sponsorshipData?.accountNumber,
		sponsorshipData?.bankName,
	]);

	const handleSponsorChange = (value: string | null) => {
		if (value) {
			const sponsorId = parseInt(value, 10);
			const selectedSponsor = sponsors.find((s) => s.id === sponsorId);

			let newBorrowerNo = borrowerNo;

			if (
				selectedSponsor?.name === 'NMDS' &&
				previousSponsorshipData?.borrowerNo
			) {
				newBorrowerNo = previousSponsorshipData.borrowerNo;
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
			<Card padding='lg' withBorder>
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
			</Card>

			<Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
				<Text size='sm'>
					<strong>Important:</strong> Make sure your sponsorship details are
					correct.
					{sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId) && (
						<span>
							{' '}
							For NMDS sponsorship, the borrower&apos;s number and correct bank
							account details are required.
						</span>
					)}{' '}
					If you&apos;re unsure about your sponsor or borrower number, please
					contact the finance office.
				</Text>
			</Alert>

			{sponsors.length === 0 && !sponsorsLoading && (
				<Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
					No sponsors found. Please contact the administration to set up
					sponsors.
				</Alert>
			)}
		</Stack>
	);
}
