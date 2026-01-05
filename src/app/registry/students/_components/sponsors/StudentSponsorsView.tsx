'use client';

import {
	getAllSponsors,
	getStudentSponsors,
	updateSponsoredStudent,
} from '@finance/sponsors';
import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	Skeleton,
	Stack,
	Switch,
	Text,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

const ALLOWED_ROLES = ['registry', 'admin', 'finance'];

export default function StudentSponsorsView({ stdNo, isActive = true }: Props) {
	const { data: session } = useSession();
	const canEdit = ALLOWED_ROLES.includes(session?.user?.role || '');

	const { data, isLoading, error } = useQuery({
		queryKey: ['student-sponsors', stdNo],
		queryFn: () => getStudentSponsors(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (error) {
		return (
			<Alert color='red' title='Error'>
				Failed to load sponsored students records. Please try again.
			</Alert>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Stack align='center' py='xl' gap='md'>
				<Text size='lg' fw={500} c='dimmed'>
					No sponsored students records found
				</Text>
				<Text size='sm' c='dimmed' ta='center'>
					This student has no sponsorship records yet.
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			{data.map((sponsoredStudent) => (
				<SponsorCard
					key={sponsoredStudent.id}
					sponsoredStudent={sponsoredStudent}
					canEdit={canEdit}
				/>
			))}
		</Stack>
	);
}

type SponsoredStudentType = Awaited<
	ReturnType<typeof getStudentSponsors>
>[number];

type SponsorCardProps = {
	sponsoredStudent: SponsoredStudentType;
	canEdit: boolean;
};

function SponsorCard({ sponsoredStudent, canEdit }: SponsorCardProps) {
	const termCodes = sponsoredStudent.sponsoredTerms
		.map((st) => st.term?.code)
		.filter(Boolean)
		.sort()
		.reverse();

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Group gap='xs'>
							<Text fw={500} size='sm'>
								{sponsoredStudent.sponsor?.name || 'Unknown Sponsor'}
							</Text>
							{sponsoredStudent.confirmed && (
								<Badge size='xs' variant='light' color='green'>
									Confirmed
								</Badge>
							)}
						</Group>
						{sponsoredStudent.borrowerNo && (
							<Text size='xs' c='dimmed'>
								Borrower No: {sponsoredStudent.borrowerNo}
							</Text>
						)}
					</Stack>
					{canEdit && (
						<EditSponsoredStudentModal sponsoredStudent={sponsoredStudent} />
					)}
				</Group>

				{(sponsoredStudent.bankName || sponsoredStudent.accountNumber) && (
					<Group gap='md'>
						{sponsoredStudent.bankName && (
							<Stack gap={2}>
								<Text size='xs' c='dimmed'>
									Bank
								</Text>
								<Text size='xs'>{sponsoredStudent.bankName}</Text>
							</Stack>
						)}
						{sponsoredStudent.accountNumber && (
							<Stack gap={2}>
								<Text size='xs' c='dimmed'>
									Account Number
								</Text>
								<Text size='xs'>{sponsoredStudent.accountNumber}</Text>
							</Stack>
						)}
					</Group>
				)}

				{termCodes.length > 0 && (
					<Stack gap={4}>
						<Text size='xs' c='dimmed'>
							Terms
						</Text>
						<Group gap='xs'>
							{termCodes.map((code) => (
								<Badge key={code} size='xs' variant='light'>
									{code}
								</Badge>
							))}
						</Group>
					</Stack>
				)}
			</Stack>
		</Paper>
	);
}

type EditSponsoredStudentModalProps = {
	sponsoredStudent: SponsoredStudentType;
};

function EditSponsoredStudentModal({
	sponsoredStudent,
}: EditSponsoredStudentModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const form = useForm({
		initialValues: {
			sponsorId: sponsoredStudent.sponsor?.id.toString() || '',
			borrowerNo: sponsoredStudent.borrowerNo || '',
			bankName: sponsoredStudent.bankName || '',
			accountNumber: sponsoredStudent.accountNumber || '',
			confirmed: sponsoredStudent.confirmed || false,
		},
	});

	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['all-sponsors'],
		queryFn: getAllSponsors,
		enabled: opened,
	});

	useEffect(() => {
		if (opened) {
			form.setValues({
				sponsorId: sponsoredStudent.sponsor?.id.toString() || '',
				borrowerNo: sponsoredStudent.borrowerNo || '',
				bankName: sponsoredStudent.bankName || '',
				accountNumber: sponsoredStudent.accountNumber || '',
				confirmed: sponsoredStudent.confirmed || false,
			});
		}
	}, [opened, sponsoredStudent, form.setValues]);

	const updateMutation = useMutation({
		mutationFn: async (data: {
			sponsorId?: number;
			borrowerNo?: string | null;
			bankName?: string | null;
			accountNumber?: string | null;
			confirmed?: boolean;
		}) => updateSponsoredStudent(sponsoredStudent.id, data),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Sponsorship record updated successfully',
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
					error instanceof Error
						? error.message
						: 'Failed to update sponsorship record',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const handleSubmit = form.onSubmit((values) => {
		updateMutation.mutate({
			sponsorId: values.sponsorId ? Number(values.sponsorId) : undefined,
			borrowerNo: values.borrowerNo || null,
			bankName: values.bankName || null,
			accountNumber: values.accountNumber || null,
			confirmed: values.confirmed,
		});
	});

	const handleClose = () => {
		form.reset();
		close();
	};

	return (
		<>
			<ActionIcon
				variant='subtle'
				color='gray'
				size='sm'
				onClick={open}
				title='Edit sponsorship record'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={handleClose}
				title='Edit Sponsorship Record'
				size='md'
				centered
			>
				<form onSubmit={handleSubmit}>
					<Stack gap='md'>
						<Select
							label='Sponsor'
							placeholder='Select a sponsor'
							data={sponsorOptions}
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

						<Switch
							label='Confirmed'
							description='Mark this sponsorship as confirmed'
							{...form.getInputProps('confirmed', { type: 'checkbox' })}
						/>

						<Group justify='flex-end' gap='sm'>
							<Button
								variant='light'
								onClick={handleClose}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
							<Button type='submit' loading={updateMutation.isPending}>
								Update
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}

function LoadingSkeleton() {
	return (
		<Stack gap='md'>
			{[1, 2].map((i) => (
				<Paper key={i} withBorder p='md'>
					<Stack gap='sm'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap={4}>
								<Group gap='xs'>
									<Skeleton height={16} width={120} />
									<Skeleton height={18} width={80} />
								</Group>
								<Skeleton height={12} width={150} />
							</Stack>
						</Group>
						<Group gap='md'>
							<Stack gap={2}>
								<Skeleton height={12} width={40} />
								<Skeleton height={12} width={80} />
							</Stack>
							<Stack gap={2}>
								<Skeleton height={12} width={80} />
								<Skeleton height={12} width={100} />
							</Stack>
						</Group>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
