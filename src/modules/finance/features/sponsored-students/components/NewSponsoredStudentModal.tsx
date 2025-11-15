'use client';

import {
	findAllSponsors,
	updateStudentSponsorshipById,
} from '@finance/sponsors/server';
import {
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import StdNoInput from '@/app/dashboard/base/StdNoInput';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';

export default function NewSponsoredStudentModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const [studentNumber, setStudentNumber] = useState<number | string>('');
	const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const { currentTerm } = useCurrentTerm();

	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, '').then((response) => response.items),
	});

	const createMutation = useMutation({
		mutationFn: async (data: {
			stdNo: number;
			termId: number;
			sponsorId: number;
		}) => {
			return updateStudentSponsorshipById(data);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Sponsored student created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['all-sponsored-students'] });
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to create sponsored student',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const isValidStudentNumber = () => {
		const strNumber = String(studentNumber);
		return strNumber.length === 9 && strNumber.startsWith('9010');
	};

	const canSubmit = isValidStudentNumber() && selectedSponsor && currentTerm;

	const handleSubmit = () => {
		if (!canSubmit) return;

		createMutation.mutate({
			stdNo: Number(studentNumber),
			termId: currentTerm.id,
			sponsorId: Number(selectedSponsor),
		});
	};

	const handleClose = () => {
		setStudentNumber('');
		setSelectedSponsor(null);
		close();
	};

	return (
		<>
			<Button
				leftSection={<IconPlus size='1rem' />}
				onClick={open}
				variant='filled'
			>
				New
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add New Sponsored Student'
				size='md'
				centered
			>
				<Stack gap='md'>
					<Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
						Add a student to a sponsorship program by entering their student
						number and selecting a sponsor.
					</Alert>

					<StdNoInput
						value={studentNumber}
						onChange={setStudentNumber}
						placeholder='Enter 9-digit student number'
					/>

					<Select
						label='Sponsor'
						placeholder='Select a sponsor'
						data={sponsorOptions}
						value={selectedSponsor}
						onChange={setSelectedSponsor}
						required
						disabled={isLoadingSponsors}
						searchable
						comboboxProps={{
							withinPortal: true,
						}}
					/>

					{!currentTerm && (
						<Alert color='red'>
							<Text size='sm'>
								No active term found. Please ensure there is an active term to
								create sponsorships.
							</Text>
						</Alert>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button
							variant='light'
							onClick={handleClose}
							disabled={createMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit}
							loading={createMutation.isPending}
						>
							Create Sponsored Student
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
