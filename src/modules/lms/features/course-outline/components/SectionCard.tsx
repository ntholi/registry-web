'use client';

import {
	Card,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import type { CourseSection } from '../types';

type SectionCardProps = {
	section: CourseSection;
	onClick: () => void;
};

function stripHtml(html: string): string {
	const div =
		typeof document !== 'undefined' ? document.createElement('div') : null;
	if (div) {
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	}
	return html.replace(/<[^>]*>/g, '');
}

function truncateText(text: string, maxLength: number): string {
	const plainText = stripHtml(text);
	if (plainText.length <= maxLength) return plainText;
	return `${plainText.substring(0, maxLength)}...`;
}

export default function SectionCard({ section, onClick }: SectionCardProps) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	return (
		<Card
			withBorder
			padding='lg'
			style={{ cursor: 'pointer' }}
			onClick={onClick}
		>
			<Text fw={600} size='md' mb='sm'>
				{section.name}
			</Text>
			<Text
				size='sm'
				c='dimmed'
				style={{
					backgroundColor:
						colorScheme === 'dark'
							? theme.colors.dark[6]
							: theme.colors.gray[0],
					padding: theme.spacing.sm,
					borderRadius: theme.radius.sm,
				}}
			>
				{truncateText(section.content, 100)}
			</Text>
		</Card>
	);
}
