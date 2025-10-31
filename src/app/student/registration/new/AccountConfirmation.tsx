import { Alert, Card, Group, Loader, LoadingOverlay, Stack, Text, TextInput } from '@mantine/core';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';
import { confirmAccountDetails } from '@/server/sponsors/actions';

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
	const { student } = useUserStudent();
	const { currentTerm } = useCurrentTerm();
	const queryClient = useQueryClient();
	const [confirmedAccountNumber, setConfirmedAccountNumber] = useState('');
	const [isConfirmed, setIsConfirmed] = useState(false);

	const confirmationMutation = useMutation({
		mutationFn: async () => {
			if (!student || !currentTerm) {
				throw new Error('Missing student or term data');
			}
			return confirmAccountDetails(student.stdNo, currentTerm.id);
		},
		onSuccess: () => {
			setIsConfirmed(true);
			onConfirmationChange(true);
			queryClient.invalidateQueries({ queryKey: ['previous-sponsorship'] });
		},
		onError: (error) => {
			console.error('Confirmation Failed:', error.message || 'Failed to confirm account details');
		},
	});

	const handleAccountNumberChange = (value: string) => {
		setConfirmedAccountNumber(value);
	};

	const accountNumberMatches = confirmedAccountNumber === sponsorshipData?.accountNumber;

	useEffect(() => {
		if (accountNumberMatches && confirmedAccountNumber && !isConfirmed) {
			confirmationMutation.mutate();
		}
	}, [accountNumberMatches, confirmedAccountNumber, isConfirmed, confirmationMutation.mutate]);

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
					<Text size='lg' fw={600}>
						Confirm Account Details
					</Text>

					<Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
						<Text size='sm'>
							<strong>
								Please review your account details below and re-enter your account number to
								confirm:
							</strong>
						</Text>
					</Alert>

					<Card padding='md' withBorder style={{ borderStyle: 'dashed' }}>
						<Stack gap='sm'>
							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Bank Name:
								</Text>
								<Text size='sm'>{sponsorshipData?.bankName || 'Not provided'}</Text>
							</Group>

							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Account Number:
								</Text>
								<Text size='sm'>{sponsorshipData?.accountNumber || 'Not provided'}</Text>
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
						onChange={(event) => handleAccountNumberChange(event.currentTarget.value)}
						size='sm'
						error={
							confirmedAccountNumber && !accountNumberMatches && 'Account numbers do not match'
						}
						rightSection={confirmationMutation.isPending && <Loader size='sm' />}
						disabled={isConfirmed}
					/>

					{isConfirmed && (
						<Alert icon={<IconCheck size='1rem' />} color='blue'>
							<Text size='sm'>
								<strong>Account confirmed</strong>
							</Text>
						</Alert>
					)}
				</Stack>
			</Card>

			<Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
				<Text size='sm'>
					<strong>Important:</strong> Once you confirm your account details by correctly re-entering
					your account number, you cannot change them without contacting the finance office. Please
					ensure all information is accurate before confirming.
				</Text>
			</Alert>
		</Stack>
	);
}
