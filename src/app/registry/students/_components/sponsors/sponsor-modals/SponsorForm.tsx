'use client';

import { getAllSponsors } from '@finance/sponsors';
import { Button, Group, Select, Stack, Switch, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';

export type SponsorFormValues = {
	sponsorId: string;
	borrowerNo: string;
	bankName: string;
	accountNumber: string;
	confirmed: boolean;
};

type Props = {
	initialValues?: Partial<SponsorFormValues>;
	onSubmit: (values: SponsorFormValues) => void;
	onCancel: () => void;
	isPending: boolean;
	submitLabel: string;
	showConfirmed?: boolean;
};

export function SponsorForm({
	initialValues,
	onSubmit,
	onCancel,
	isPending,
	submitLabel,
	showConfirmed = false,
}: Props) {
	const form = useForm<SponsorFormValues>({
		initialValues: {
			sponsorId: initialValues?.sponsorId || '',
			borrowerNo: initialValues?.borrowerNo || '',
			bankName: initialValues?.bankName || '',
			accountNumber: initialValues?.accountNumber || '',
			confirmed: initialValues?.confirmed || false,
		},
		validate: {
			sponsorId: (value) => (!value ? 'Sponsor is required' : null),
		},
	});

	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['all-sponsors'],
		queryFn: getAllSponsors,
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<Stack gap='md'>
				<Select
					label='Sponsor'
					placeholder='Select a sponsor'
					data={sponsorOptions}
					required
					disabled={isLoadingSponsors}
					searchable
					comboboxProps={{ withinPortal: true }}
					{...form.getInputProps('sponsorId')}
				/>

				<TextInput
					label='Borrower Number'
					placeholder='Enter borrower number (optional)'
					{...form.getInputProps('borrowerNo')}
				/>

				<TextInput
					label='Bank Name'
					placeholder='Enter bank name (optional)'
					{...form.getInputProps('bankName')}
				/>

				<TextInput
					label='Account Number'
					placeholder='Enter account number (optional)'
					{...form.getInputProps('accountNumber')}
				/>

				{showConfirmed && (
					<Switch
						label='Confirmed'
						description='Mark this sponsorship as confirmed'
						{...form.getInputProps('confirmed', { type: 'checkbox' })}
					/>
				)}

				<Group justify='flex-end' gap='sm'>
					<Button variant='light' onClick={onCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button type='submit' loading={isPending}>
						{submitLabel}
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
