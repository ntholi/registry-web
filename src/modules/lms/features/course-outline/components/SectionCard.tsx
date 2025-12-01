'use client';

import {
	Box,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	ThemeIcon,
	TypographyStylesProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText } from '@tabler/icons-react';
import type { CourseSection } from '../types';

type SectionCardProps = {
	section: CourseSection;
};

function truncateHtml(html: string, maxLength: number): string {
	const text = html.replace(/<[^>]*>/g, '');
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength)}...`;
}

export default function SectionCard({ section }: SectionCardProps) {
	const [opened, { open, close }] = useDisclosure(false);

	return (
		<>
			<Card withBorder p='lg' style={{ cursor: 'pointer' }} onClick={open}>
				<Stack gap='md'>
					<Group align='flex-start' wrap='nowrap'>
						<ThemeIcon variant='light' size='xl' radius='md'>
							<Text size='sm' fw={700}>
								{section.pagenum}
							</Text>
						</ThemeIcon>
						<Box style={{ flex: 1 }}>
							<Text fw={600} size='sm' lineClamp={2}>
								{section.title}
							</Text>
							<Text size='xs' c='dimmed' mt='xs'>
								{truncateHtml(section.content, 100)}
							</Text>
						</Box>
					</Group>
				</Stack>
			</Card>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap='sm'>
						<ThemeIcon variant='light' size='lg'>
							<IconFileText size={18} />
						</ThemeIcon>
						<Text fw={600}>{section.title}</Text>
					</Group>
				}
				size='lg'
			>
				<TypographyStylesProvider>
					<div dangerouslySetInnerHTML={{ __html: section.content }} />
				</TypographyStylesProvider>
			</Modal>
		</>
	);
}
