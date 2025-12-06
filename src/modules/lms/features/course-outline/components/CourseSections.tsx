'use client';

import {
	Badge,
	Box,
	Card,
	Group,
	Modal,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBook2 } from '@tabler/icons-react';
import { useState } from 'react';
import type { CourseSection } from '../types';

type CourseSectionsProps = {
	sections: CourseSection[];
	isLoading?: boolean;
};

function truncateContent(html: string, maxLength: number = 100): string {
	const tempDiv =
		typeof document !== 'undefined' ? document.createElement('div') : null;
	if (!tempDiv) {
		return html.replace(/<[^>]*>/g, '').slice(0, maxLength);
	}
	tempDiv.innerHTML = html;
	const text = tempDiv.textContent || tempDiv.innerText || '';
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
}

function SectionCardSkeleton() {
	return (
		<Card withBorder p='lg'>
			<Stack gap='sm'>
				<Group>
					<Skeleton height={24} width={40} radius='md' />
					<Skeleton height={20} width='60%' />
				</Group>
				<Skeleton height={14} width='100%' />
				<Skeleton height={14} width='80%' />
			</Stack>
		</Card>
	);
}

export default function CourseSections({
	sections,
	isLoading,
}: CourseSectionsProps) {
	const theme = useMantineTheme();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSection, setSelectedSection] = useState<CourseSection | null>(
		null
	);

	function handleSectionClick(section: CourseSection) {
		setSelectedSection(section);
		open();
	}

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{[1, 2, 3].map((i) => (
					<SectionCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	if (sections.length === 0) {
		return (
			<Box py='xl' ta='center'>
				<Stack align='center' gap='sm'>
					<IconBook2
						size={48}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='sm'>
						No sections added yet
					</Text>
				</Stack>
			</Box>
		);
	}

	return (
		<>
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{sections.map((section) => (
					<Card
						key={section.id}
						withBorder
						p='lg'
						style={{ cursor: 'pointer' }}
						onClick={() => handleSectionClick(section)}
					>
						<Stack gap='sm'>
							<Group gap='sm'>
								<Badge variant='default' size='lg'>
									{section.pagenum}
								</Badge>
								<Text fw={600} size='sm' lineClamp={1}>
									{section.title.length > 30
										? `${section.title.slice(0, 30)}...`
										: section.title}
								</Text>
							</Group>
							<Text size='xs' c='dimmed' lineClamp={3}>
								{truncateContent(section.content, 100)}
							</Text>
						</Stack>
					</Card>
				))}
			</SimpleGrid>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap='sm'>
						{selectedSection && (
							<Badge variant='light' size='lg'>
								{selectedSection.pagenum}
							</Badge>
						)}
						<Text fw={600}>{selectedSection?.title}</Text>
					</Group>
				}
				size='lg'
			>
				{selectedSection && (
					<Box
						p='md'
						style={{
							borderRadius: theme.radius.md,
						}}
					>
						<div
							dangerouslySetInnerHTML={{ __html: selectedSection.content }}
						/>
					</Box>
				)}
			</Modal>
		</>
	);
}
