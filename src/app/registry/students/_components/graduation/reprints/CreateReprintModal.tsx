'use client';

import {
	Button,
	Card,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDeviceIpadHorizontalPlus } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createCertificateReprint } from '@/app/registry/certificate-reprints';
import { getPublishedAcademicHistory } from '../../../_server/actions';

type Props = {
	stdNo: number;
};

type FormValues = {
	receiptNumber: string;
	reason: string;
};

export default function CreateReprintModal({ stdNo }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const { data: session } = useSession();

	const { data: student, isLoading } = useQuery({
		queryKey: ['student', stdNo, 'published'],
		queryFn: () => getPublishedAcademicHistory(stdNo),
		enabled: opened,
	});

	const form = useForm<FormValues>({
		initialValues: {
			receiptNumber: '',
			reason: '',
		},
		validate: {
			reason: (value) =>
				value.trim().length < 5 ? 'Reason must be at least 5 characters' : null,
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (!session?.user?.id) {
				throw new Error('User not authenticated');
			}

			return createCertificateReprint({
				stdNo,
				receiptNumber: values.receiptNumber || null,
				reason: values.reason,
				createdBy: session.user.id,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Certificate reprint request created',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['certificate-reprints', stdNo],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to create reprint request',
				color: 'red',
			});
		},
	});

	function handleClose() {
		form.reset();
		close();
	}

	function handleSubmit(values: FormValues) {
		mutation.mutate(values);
	}

	const activeProgram = student?.programs?.find(
		(p) => p?.status === 'Completed'
	);

	return (
		<>
			<Button
				variant='subtle'
				color='gray'
				leftSection={<IconDeviceIpadHorizontalPlus size={14} />}
				size='xs'
				onClick={open}
			>
				Create
			</Button>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Create Certificate Reprint'
				size='md'
			>
				{isLoading ? (
					<Stack align='center' py='xl'>
						<Loader size='md' />
						<Text size='sm' c='dimmed'>
							Loading student information...
						</Text>
					</Stack>
				) : (
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<Stack gap='md'>
							<Card>
								<Stack gap={4}>
									<Group gap='xs'>
										<Text size='sm' c='dimmed' w={120}>
											Student No:
										</Text>
										<Text size='sm' fw={500}>
											{stdNo}
										</Text>
									</Group>
									<Group gap='xs'>
										<Text size='sm' c='dimmed' w={120}>
											Name:
										</Text>
										<Text size='sm' fw={500}>
											{student?.name || 'N/A'}
										</Text>
									</Group>
									<Group gap='xs'>
										<Text size='sm' c='dimmed' w={120}>
											Phone 1:
										</Text>
										<Text size='sm' fw={500}>
											{student?.phone1 || 'N/A'}
										</Text>
									</Group>
									<Group gap='xs'>
										<Text size='sm' c='dimmed' w={120}>
											Phone 2:
										</Text>
										<Text size='sm' fw={500}>
											{student?.phone2 || 'N/A'}
										</Text>
									</Group>
									<Group gap='xs'>
										<Text size='sm' c='dimmed' w={120}>
											Graduation Date:
										</Text>
										<Text size='sm' fw={500}>
											{activeProgram?.graduationDate || 'N/A'}
										</Text>
									</Group>
								</Stack>
							</Card>

							<TextInput
								label='Receipt Number'
								placeholder='Enter receipt number (optional)'
								{...form.getInputProps('receiptNumber')}
							/>

							<Textarea
								label='Reason for Reprint'
								placeholder='Enter reason why the certificate needs to be reprinted'
								required
								minRows={3}
								{...form.getInputProps('reason')}
							/>

							<Group justify='flex-end' mt='md'>
								<Button variant='default' onClick={handleClose}>
									Cancel
								</Button>
								<Button type='submit' loading={mutation.isPending}>
									Create Reprint
								</Button>
							</Group>
						</Stack>
					</form>
				)}
			</Modal>
		</>
	);
}
