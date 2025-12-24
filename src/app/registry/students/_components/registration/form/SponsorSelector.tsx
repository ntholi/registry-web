'use client';

import { getAllSponsors } from '@finance/sponsors';
import { Select, Stack, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

type Props = {
	value: SponsorshipData;
	onChange: (value: SponsorshipData) => void;
	errors?: {
		sponsorId?: string;
		borrowerNo?: string;
	};
};

export default function SponsorSelector({ value, onChange, errors }: Props) {
	const { data: sponsors, isLoading } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => getAllSponsors(),
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const selectedSponsor = sponsors?.find((s) => s.id === value.sponsorId);
	const requiresBankDetails = selectedSponsor?.name === 'NMDS';

	return (
		<Stack gap='sm'>
			<Select
				label='Sponsor'
				placeholder='Select sponsor'
				data={sponsorOptions}
				value={value.sponsorId?.toString() || ''}
				onChange={(val) => {
					const sponsorId = val ? Number.parseInt(val, 10) : 0;
					onChange({ ...value, sponsorId });
				}}
				error={errors?.sponsorId}
				searchable
				clearable
				disabled={isLoading}
			/>

			{requiresBankDetails && (
				<>
					<TextInput
						label='Borrower Number'
						placeholder='Enter borrower number'
						value={value.borrowerNo || ''}
						onChange={(e) =>
							onChange({ ...value, borrowerNo: e.currentTarget.value })
						}
						error={errors?.borrowerNo}
					/>

					<TextInput
						label='Bank Name'
						placeholder='Enter bank name'
						value={value.bankName || ''}
						onChange={(e) =>
							onChange({ ...value, bankName: e.currentTarget.value })
						}
					/>

					<TextInput
						label='Account Number'
						placeholder='Enter account number'
						value={value.accountNumber || ''}
						onChange={(e) =>
							onChange({ ...value, accountNumber: e.currentTarget.value })
						}
					/>
				</>
			)}
		</Stack>
	);
}
