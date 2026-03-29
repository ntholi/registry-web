'use client';

import type { mailTemplates } from '@mail/_database';
import { mailTriggers } from '@mail/_lib/triggers';
import {
	ActionIcon,
	Badge,
	Card,
	Group,
	Stack,
	Switch,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { DeleteButton } from '@/shared/ui/adease';
import {
	deleteMailTemplate,
	toggleMailTemplateActive,
} from '../../_server/actions';

type MailTemplate = NonNullable<typeof mailTemplates.$inferSelect>;

type Props = {
	template: MailTemplate;
};

export default function TemplateDetail({ template }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const trigger = mailTriggers.find((t) => t.type === template.triggerType);

	const toggleMutation = useActionMutation(toggleMailTemplateActive, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['mail-templates'] });
			notifications.show({
				message: `Template ${template.isActive ? 'deactivated' : 'activated'}`,
				color: 'green',
			});
		},
	});

	return (
		<Stack p='lg'>
			<Group justify='space-between'>
				<Stack gap={4}>
					<Group>
						<ActionIcon
							variant='subtle'
							color='gray'
							onClick={() => router.push('/mail/templates')}
						>
							<IconArrowLeft size={18} />
						</ActionIcon>
						<Title order={2}>{template.name}</Title>
					</Group>
					<Group ml={42} gap='xs'>
						{trigger && (
							<Badge variant='light' size='sm'>
								{trigger.label}
							</Badge>
						)}
					</Group>
				</Stack>
				<Stack gap={5}>
					<Switch
						offLabel='Inactive'
						onLabel='Active'
						size='lg'
						styles={{
							trackLabel: {
								width: '50px',
								padding: '0 4px',
							},
						}}
						checked={template.isActive}
						onChange={() => toggleMutation.mutate(template.id)}
						disabled={toggleMutation.isPending}
						color='green'
					/>
					<Group gap='sm'>
						<ActionIcon
							variant='subtle'
							color='blue'
							onClick={() => router.push(`/mail/templates/${template.id}/edit`)}
						>
							<IconEdit size={18} />
						</ActionIcon>
						<DeleteButton
							handleDelete={() => deleteMailTemplate(template.id)}
							queryKey={['mail-templates']}
							itemName={template.name}
							itemType='template'
							variant='subtle'
						/>
					</Group>
				</Stack>
			</Group>

			<Card withBorder p='md'>
				<Stack gap='xs'>
					<Text size='sm' fw={600} c='dimmed'>
						Subject
					</Text>
					<Text size='sm'>{template.subject}</Text>
				</Stack>
			</Card>

			<Card withBorder p='md'>
				<Text size='sm' fw={600} c='dimmed' mb='xs'>
					Body
				</Text>
				<div
					// biome-ignore lint: template preview
					dangerouslySetInnerHTML={{ __html: template.body }}
				/>
			</Card>
		</Stack>
	);
}
