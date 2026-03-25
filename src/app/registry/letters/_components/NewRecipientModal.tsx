'use client';

import {
	ActionIcon,
	Button,
	Group,
	Modal,
	SimpleGrid,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { createRecipient } from '../_server/actions';

type Props = {
	templateId: string;
	onCreated: (id: string) => void;
};

export default function NewRecipientModal({ templateId, onCreated }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const form = useForm({
		initialValues: { title: '', org: '', address: '', city: '' },
	});

	const mutation = useMutation({
		mutationFn: async (values: typeof form.values) => {
			return unwrap(
				await createRecipient({
					templateId,
					title: values.title,
					org: values.org,
					address: values.address || null,
					city: values.city || null,
				})
			);
		},
		onSuccess: (data) => {
			if (!data) return;
			onCreated(data.id);
			form.reset();
			close();
		},
	});

	return (
		<>
			<ActionIcon variant='light' size='input-sm' onClick={open}>
				<IconPlus size={18} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='New Recipient'>
				<form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
					<Stack>
						<TextInput
							label='Title'
							placeholder='e.g. The Director'
							required
							{...form.getInputProps('title')}
						/>
						<TextInput
							label='Organisation'
							placeholder='e.g. N.M.D.S.'
							required
							{...form.getInputProps('org')}
						/>
						<SimpleGrid cols={2}>
							<TextInput
								label='Address'
								placeholder='e.g. Box 517'
								{...form.getInputProps('address')}
							/>
							<TextInput
								label='City'
								placeholder='e.g. MASERU'
								{...form.getInputProps('city')}
							/>
						</SimpleGrid>
						<Group justify='flex-end'>
							<Button variant='default' onClick={close}>
								Cancel
							</Button>
							<Button type='submit' loading={mutation.isPending}>
								Add Recipient
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
