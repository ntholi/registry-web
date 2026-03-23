'use client';

import {
	ActionIcon,
	Badge,
	Card,
	Group,
	Menu,
	Modal,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { letterTemplates } from '@registry/_database';
import {
	IconDotsVertical,
	IconEdit,
	IconToggleLeft,
	IconTrash,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { DeleteButton } from '@/shared/ui/adease';
import {
	deleteLetterTemplate,
	toggleTemplateActive,
	updateLetterTemplate,
} from '../_server/actions';
import TemplateForm from './TemplateForm';

type LetterTemplate = NonNullable<typeof letterTemplates.$inferSelect>;

type Props = {
	template: LetterTemplate;
};

export default function TemplateCard({ template }: Props) {
	const [editOpened, { open: openEdit, close: closeEdit }] =
		useDisclosure(false);
	const queryClient = useQueryClient();

	const toggleMutation = useActionMutation(toggleTemplateActive, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
			notifications.show({
				message: `Template ${template.isActive ? 'deactivated' : 'activated'}`,
				color: 'green',
			});
		},
	});

	return (
		<>
			<Modal
				opened={editOpened}
				onClose={closeEdit}
				title='Edit Template'
				size='xl'
			>
				<TemplateForm
					title='Edit Template'
					defaultValues={template}
					onSubmit={(values) => updateLetterTemplate(template.id, values)}
				/>
			</Modal>

			<Card withBorder shadow='sm' padding='lg'>
				<Group justify='space-between' mb='xs'>
					<Text fw={600} lineClamp={1}>
						{template.name}
					</Text>
					<Menu position='bottom-end' withinPortal>
						<Menu.Target>
							<ActionIcon variant='subtle' color='gray'>
								<IconDotsVertical size={16} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								leftSection={<IconEdit size={14} />}
								onClick={openEdit}
							>
								Edit
							</Menu.Item>
							<Menu.Item
								leftSection={<IconToggleLeft size={14} />}
								onClick={() => toggleMutation.mutate(template.id)}
							>
								{template.isActive ? 'Deactivate' : 'Activate'}
							</Menu.Item>
							<Menu.Divider />
							<DeleteButton
								handleDelete={() => deleteLetterTemplate(template.id)}
								queryKey={['letter-templates']}
								itemName={template.name}
								itemType='template'
								variant='transparent'
								color='red'
								w='100%'
							>
								<Menu.Item color='red' leftSection={<IconTrash size={14} />}>
									Delete
								</Menu.Item>
							</DeleteButton>
						</Menu.Dropdown>
					</Menu>
				</Group>

				<Group gap='xs'>
					{template.role ? (
						<Badge variant='light' size='sm'>
							{template.role.replace(/_/g, ' ')}
						</Badge>
					) : (
						<Badge variant='light' color='gray' size='sm'>
							System-wide
						</Badge>
					)}
					<Badge
						variant='dot'
						color={template.isActive ? 'green' : 'red'}
						size='sm'
					>
						{template.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</Group>
			</Card>
		</>
	);
}
