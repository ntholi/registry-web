'use client';

import {
	findAllSponsors,
	updateStudentSponsorshipById,
} from '@finance/sponsors';
import {
	Alert,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';

type Props = {
	stdNo: number;
	opened: boolean;
	onClose: () => void;
};

export default function NewSponsorModal({ stdNo, opened, onClose }: Props) {
	const [selectedSponsor, setSelectedSponsor] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const { activeTerm } = useActiveTerm();

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
				message: 'Sponsor assigned successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student-sponsors'] });
			queryClient.invalidateQueries({
				queryKey: ['student-registration-data'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error ? error.message : 'Failed to assign sponsor',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const canSubmit = selectedSponsor && activeTerm;

	const handleSubmit = () => {
		if (!canSubmit) return;

		createMutation.mutate({
			stdNo,
			termId: activeTerm.id,
			sponsorId: Number(selectedSponsor),
		});
	};

	const handleClose = () => {
		setSelectedSponsor(null);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Assign New Sponsor'
			size='md'
			centered
		>
			<Stack gap='md'>
				<Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
					Assign a sponsor to this student for the current active term.
				</Alert>

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

				{!activeTerm && (
					<Alert color='red'>
						<Text size='sm'>
							No active term found. Please ensure there is an active term to
							assign sponsorships.
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
						Assign Sponsor
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
