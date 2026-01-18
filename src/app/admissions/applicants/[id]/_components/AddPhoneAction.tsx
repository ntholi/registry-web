'use client';

import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { addApplicantPhone } from '../../_server/actions';

type Props = {
	applicantId: string;
};

export default function AddPhoneAction({ applicantId }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const form = useForm({
		initialValues: { phoneNumber: '' },
		validate: {
			phoneNumber: (v) => (v ? null : 'Phone number is required'),
		},
	});

	const addMutation = useMutation({
		mutationFn: (phoneNumber: string) =>
			addApplicantPhone(applicantId, phoneNumber),
		onSuccess: () => {
			form.reset();
			close();
			router.refresh();
			notifications.show({
				title: 'Success',
				message: 'Phone number added',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return (
		<>
			<Button
				variant='light'
				size='xs'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Phone
			</Button>

			<Modal opened={opened} onClose={close} title='Add Phone Number' centered>
				<form
					onSubmit={form.onSubmit((values) =>
						addMutation.mutate(values.phoneNumber)
					)}
				>
					<Stack gap='md'>
						<TextInput
							label='Phone Number'
							placeholder='Enter phone number'
							required
							{...form.getInputProps('phoneNumber')}
						/>
						<Group justify='flex-end'>
							<Button variant='subtle' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={addMutation.isPending}>
								Add
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
