'use client';

import type { mailTemplates } from '@mail/_database';
import {
	Badge,
	Card,
	Group,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { IconMailSpark } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { mailTriggers } from '../../_lib/triggers';

type MailTemplate = NonNullable<typeof mailTemplates.$inferSelect>;

type Props = {
	template: MailTemplate;
};

export default function TemplateCard({ template }: Props) {
	const router = useRouter();
	const trigger = mailTriggers.find((t) => t.type === template.triggerType);

	return (
		<UnstyledButton
			onClick={() => router.push(`/mail/templates/${template.id}`)}
		>
			<Card withBorder padding='lg' radius='md'>
				<Group wrap='nowrap' gap='md'>
					<ThemeIcon
						size={44}
						radius='md'
						variant='light'
						color={template.isActive ? 'blue' : 'gray'}
					>
						<IconMailSpark size={22} />
					</ThemeIcon>
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Text fw={600} size='sm' lineClamp={1}>
							{template.name}
						</Text>
						<Group gap='xs'>
							{trigger && (
								<Badge variant='light' size='xs' tt='capitalize'>
									{trigger.label}
								</Badge>
							)}
							<Badge
								variant='dot'
								color={template.isActive ? 'green' : 'red'}
								size='xs'
							>
								{template.isActive ? 'Active' : 'Inactive'}
							</Badge>
						</Group>
					</Stack>
				</Group>
			</Card>
		</UnstyledButton>
	);
}
