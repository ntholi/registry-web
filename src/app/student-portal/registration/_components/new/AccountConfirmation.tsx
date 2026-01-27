'use client';

import {
	Alert,
	Card,
	Group,
	LoadingOverlay,
	Paper,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

interface AccountConfirmationProps {
	sponsorshipData: SponsorshipData | null;
	onConfirmationChange: (confirmed: boolean) => void;
	loading: boolean;
}

export default function AccountConfirmation({
	sponsorshipData,
	onConfirmationChange,
	loading,
}: AccountConfirmationProps) {
	const [confirmedAccountNumber, setConfirmedAccountNumber] = useState('');

	const accountNumberMatches =
		confirmedAccountNumber === sponsorshipData?.accountNumber;

	const handleAccountNumberChange = (value: string) => {
		setConfirmedAccountNumber(value);
		onConfirmationChange(value === sponsorshipData?.accountNumber);
	};

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
					<Text size='lg' fw={600}>
						Confirm Account Details
					</Text>

					<Alert color='blue'>
						<Text size='sm'>
							Please review your account details below and re-enter your account
							number to confirm:
						</Text>
					</Alert>

					<Card padding='md' withBorder style={{ borderStyle: 'dashed' }}>
						<Stack gap='sm'>
							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Bank Name:
								</Text>
								<Text size='sm'>
									{sponsorshipData?.bankName || 'Not provided'}
								</Text>
							</Group>

							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Account Number:
								</Text>
								<Text size='sm'>
									{sponsorshipData?.accountNumber || 'Not provided'}
								</Text>
							</Group>

							{sponsorshipData?.borrowerNo && (
								<Group justify='space-between'>
									<Text size='sm' fw={500}>
										Borrower Number:
									</Text>
									<Text size='sm'>{sponsorshipData.borrowerNo}</Text>
								</Group>
							)}
						</Stack>
					</Card>

					<TextInput
						label='Confirm Account Number'
						placeholder='Re-enter your account number'
						value={confirmedAccountNumber}
						onChange={(event) =>
							handleAccountNumberChange(event.currentTarget.value)
						}
						size='sm'
						error={
							confirmedAccountNumber &&
							!accountNumberMatches &&
							'Account numbers do not match'
						}
						disabled={accountNumberMatches && !!confirmedAccountNumber}
					/>

					{accountNumberMatches && confirmedAccountNumber && (
						<Alert icon={<IconCheck size='1rem' />} color='blue'>
							<Text size='sm'>
								<strong>Account confirmed</strong>
							</Text>
						</Alert>
					)}
				</Stack>
			</Paper>

			<Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
				<Text size='sm'>
					<strong>Important:</strong> Please ensure your account details are
					accurate before proceeding with registration.
				</Text>
			</Alert>
		</Stack>
	);
}
