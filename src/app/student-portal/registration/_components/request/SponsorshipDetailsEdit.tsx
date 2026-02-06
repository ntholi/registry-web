'use client';

import {
	findAllSponsors,
	getStudentCurrentSponsorship,
} from '@finance/sponsors';
import {
	Alert,
	LoadingOverlay,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import { getAlertColor } from '@/shared/lib/utils/colors';

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
};

interface Props {
	sponsorshipData: SponsorshipData | null;
	onSponsorshipChange: (data: SponsorshipData) => void;
	loading: boolean;
}

export default function SponsorshipDetailsEdit({
	sponsorshipData,
	onSponsorshipChange,
	loading,
}: Props) {
	const { student } = useUserStudent();

	const [borrowerNo, setBorrowerNo] = useState(
		sponsorshipData?.borrowerNo || ''
	);

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

	useEffect(() => {
		if (
			currentSponsorship &&
			sponsors.length > 0 &&
			!sponsorshipData?.sponsorId
		) {
			const sponsorId = currentSponsorship.sponsorId;
			const newBorrowerNo = currentSponsorship.borrowerNo || '';

			setBorrowerNo(newBorrowerNo);

			onSponsorshipChange({
				sponsorId,
				borrowerNo: newBorrowerNo || undefined,
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
					)}
				</Stack>
			</Paper>

			<Alert
				icon={<IconInfoCircle size='1rem' />}
				color={getAlertColor('info')}
			>
				<Text size='sm'>
					<strong>Note:</strong> When editing your registration, only sponsor
					and borrower number can be updated. Banking details cannot be changed
					during registration updates. If you need to update banking details,
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
