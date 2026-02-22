'use client';

import { getStudentSponsors } from '@finance/sponsors';
import {
	ActionIcon,
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
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { updateStudentSemester } from '../../../_server/actions';

type EditSemesterSponsorModalProps = {
	semesterId: number;
	stdNo: number;
	currentSponsorId: number | null;
};

export function EditSemesterSponsorModal({
	semesterId,
	stdNo,
	currentSponsorId,
}: EditSemesterSponsorModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(
		null
	);
	const [showConfirm, setShowConfirm] = useState(false);
	const queryClient = useQueryClient();

	const { data: studentSponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['student-sponsors', stdNo],
		queryFn: () => getStudentSponsors(stdNo),
		enabled: opened,
	});

	useEffect(() => {
		if (opened && currentSponsorId) {
			setSelectedSponsorId(currentSponsorId.toString());
		}
	}, [opened, currentSponsorId]);

	const updateMutation = useMutation({
		mutationFn: async (sponsorId: number | null) =>
			updateStudentSemester(semesterId, { sponsorId }),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Semester sponsor updated successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['student-registration-data'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to update semester sponsor',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		studentSponsors?.map((ss) => ({
			value: ss.sponsor?.id.toString() || '',
			label: ss.sponsor?.name || 'Unknown',
		})) || [];

	const selectedSponsorName = selectedSponsorId
		? sponsorOptions.find((opt) => opt.value === selectedSponsorId)?.label ||
			'Unknown'
		: 'No Sponsor';

	const handleSubmit = () => {
		const sponsorId = selectedSponsorId ? Number(selectedSponsorId) : null;

		if (!showConfirm) {
			setShowConfirm(true);
			return;
		}

		updateMutation.mutate(sponsorId);
	};

	const handleClose = () => {
		setSelectedSponsorId(currentSponsorId?.toString() || null);
		setShowConfirm(false);
		close();
	};

	return (
		<>
			<ActionIcon
				variant='subtle'
				color='gray'
				size='sm'
				onClick={open}
				title='Edit semester sponsor'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={handleClose}
				title='Edit Semester Sponsor'
				size='md'
				centered
			>
				<Stack gap='md'>
					<Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
						<Text size='sm'>
							Select a sponsor from the student&apos;s existing sponsorship
							records. To add a new sponsor, use the &quot;New Sponsor&quot;
							button at the top of this page.
						</Text>
					</Alert>

					{studentSponsors?.length === 0 ? (
						<Alert color='yellow'>
							<Text size='sm'>
								No sponsorship records found. Please create a sponsorship record
								using the &quot;New Sponsor&quot; button first.
							</Text>
						</Alert>
					) : (
						<Select
							label='Sponsor'
							placeholder='Select a sponsor'
							data={sponsorOptions}
							value={selectedSponsorId}
							onChange={(val) => {
								setSelectedSponsorId(val);
								setShowConfirm(false);
							}}
							disabled={isLoadingSponsors}
							searchable
							clearable
							comboboxProps={{ withinPortal: true }}
						/>
					)}

					{showConfirm && (
						<Alert color='orange' title='Confirm Change'>
							<Text size='sm'>
								Are you sure you want to change the sponsor for this semester to{' '}
								<strong>{selectedSponsorName}</strong>?
							</Text>
						</Alert>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button
							variant='light'
							onClick={handleClose}
							disabled={updateMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							loading={updateMutation.isPending}
							disabled={studentSponsors?.length === 0}
							color={showConfirm ? 'orange' : 'blue'}
						>
							{showConfirm ? 'Confirm Update' : 'Update'}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
