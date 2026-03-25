'use client';

import {
	Badge,
	Card,
	Group,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import type { letterTemplates } from '@registry/_database';
import { IconFileText } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

type LetterTemplate = NonNullable<typeof letterTemplates.$inferSelect>;

type Props = {
	template: LetterTemplate;
};

export default function TemplateCard({ template }: Props) {
	const router = useRouter();

	return (
		<UnstyledButton
			onClick={() => router.push(`/registry/letters/templates/${template.id}`)}
		>
			<Card withBorder padding='lg' radius='md'>
				<Group wrap='nowrap' gap='md'>
					<ThemeIcon
						size={44}
						radius='md'
						variant='light'
						color={template.isActive ? 'blue' : 'gray'}
					>
						<IconFileText size={22} />
					</ThemeIcon>
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<Text fw={600} size='sm' lineClamp={1}>
							{template.name}
						</Text>
						<Group gap='xs'>
							{template.role ? (
								<Badge variant='light' size='xs' tt='capitalize'>
									{template.role.replace(/_/g, ' ')}
								</Badge>
							) : (
								<Badge variant='light' color='gray' size='xs'>
									System-wide
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
