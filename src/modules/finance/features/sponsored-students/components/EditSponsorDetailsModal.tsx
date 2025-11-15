'use client';

import {
	findAllSponsors,
	updateStudentSponsorshipById,
} from '@finance/sponsors/server';
import {
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Switch,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';

interface SponsoredStudentData {
	id: number;
	sponsorId: number;
	stdNo: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
	confirmed?: boolean;
	sponsor: {
		id: number;
		name: string;
	};
	student: {
		stdNo: number;
		name: string;
	};
}

interface EditSponsorDetailsModalProps {
	sponsoredStudent: SponsoredStudentData;
}

export default function EditSponsorDetailsModal({
	sponsoredStudent,
}: EditSponsorDetailsModalProps) {
	const [opened, setOpened] = useState(false);
	const [sponsorId, setSponsorId] = useState(sponsoredStudent.sponsorId);
	const [borrowerNo, setBorrowerNo] = useState(
		sponsoredStudent.borrowerNo || ''
	);
	const [bankName, setBankName] = useState(sponsoredStudent.bankName || '');
	const [accountNumber, setAccountNumber] = useState(
		sponsoredStudent.accountNumber || ''
	);
	const [confirmed, setConfirmed] = useState(
		sponsoredStudent.confirmed || false
	);

	const bankOptions = [
		{ value: 'SLB', label: 'Standard Lesotho Bank' },
		{ value: 'NED', label: 'NetBank' },
		{ value: 'FNB', label: 'First National Bank' },
		{ value: 'LPB', label: 'Lesotho Post Bank' },
	];

	const { currentTerm } = useCurrentTerm();
	const queryClient = useQueryClient();

	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, '').then((response) => response.items),
	});

	const updateMutation = useMutation({
		mutationFn: (data: {
			stdNo: number;
			termId: number;
			sponsorId: number;
			borrowerNo?: string;
			bankName?: string;
			accountNumber?: string;
			confirmed?: boolean;
		}) => updateStudentSponsorshipById(data),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Sponsor details updated successfully',
				color: 'green',
			});
			setOpened(false);
			queryClient.invalidateQueries({ queryKey: ['all-sponsored-students'] });
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to update sponsor details',
				color: 'red',
			});
		},
	});

	const isNMDS = (selectedSponsorId: number) => {
		return sponsors?.find((s) => s.id === selectedSponsorId)?.name === 'NMDS';
	};

	const handleSponsorChange = (value: string | null) => {
		if (value) {
			const newSponsorId = parseInt(value, 10);
			setSponsorId(newSponsorId);

			if (!isNMDS(newSponsorId)) {
				setBorrowerNo('');
			}
		}
	};

	const handleSubmit = () => {
		if (!currentTerm) {
			notifications.show({
				title: 'Error',
				message: 'No active term found',
				color: 'red',
			});
			return;
		}

		updateMutation.mutate({
			stdNo: sponsoredStudent.stdNo,
			termId: currentTerm.id,
			sponsorId,
			borrowerNo: borrowerNo || undefined,
			bankName: bankName || undefined,
			accountNumber: accountNumber || undefined,
			confirmed,
		});
	};

	const resetForm = () => {
		setSponsorId(sponsoredStudent.sponsorId);
		setBorrowerNo(sponsoredStudent.borrowerNo || '');
		setBankName(sponsoredStudent.bankName || '');
		setAccountNumber(sponsoredStudent.accountNumber || '');
		setConfirmed(sponsoredStudent.confirmed || false);
	};

	const handleClose = () => {
		setOpened(false);
		resetForm();
	};

	const hasChanges =
		sponsorId !== sponsoredStudent.sponsorId ||
		borrowerNo !== (sponsoredStudent.borrowerNo || '') ||
		bankName !== (sponsoredStudent.bankName || '') ||
		accountNumber !== (sponsoredStudent.accountNumber || '') ||
		confirmed !== (sponsoredStudent.confirmed || false);

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconEdit size='0.875rem' />}
				onClick={() => setOpened(true)}
			>
				Edit
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title={`Edit Sponsor Details - ${sponsoredStudent.student.name}`}
				size='md'
			>
				<Stack gap='md'>
					<Text size='sm' c='dimmed'>
						Student Number: {sponsoredStudent.stdNo}
					</Text>

					<Select
						label='Sponsor'
						placeholder='Select sponsor'
						data={
							sponsors?.map((sponsor) => ({
								value: sponsor.id.toString(),
								label: sponsor.name,
							})) || []
						}
						value={sponsorId.toString()}
						onChange={handleSponsorChange}
						required
						disabled={isLoadingSponsors}
					/>

					<TextInput
						label='Borrower Number'
						placeholder='Enter borrower number'
						value={borrowerNo}
						onChange={(event) => setBorrowerNo(event.currentTarget.value)}
						disabled={!isNMDS(sponsorId)}
						required={isNMDS(sponsorId)}
					/>

					<Select
						label='Bank Name'
						placeholder='Select bank'
						data={bankOptions}
						value={bankName || null}
						onChange={(value: string | null) => setBankName(value || '')}
						searchable
						clearable
					/>

					<TextInput
						label='Account Number'
						placeholder='Enter account number'
						value={accountNumber}
						onChange={(event) => setAccountNumber(event.currentTarget.value)}
					/>

					{isNMDS(sponsorId) && (
						<Switch
							label='Account Confirmed'
							description='Mark account details as confirmed'
							checked={confirmed}
							onChange={(event) => setConfirmed(event.currentTarget.checked)}
						/>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button variant='default' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							loading={updateMutation.isPending}
							disabled={
								!hasChanges || (isNMDS(sponsorId) && !borrowerNo.trim())
							}
						>
							Update Details
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
