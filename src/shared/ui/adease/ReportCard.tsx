'use client';

import { Box, Card, Flex, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

export type ReportLink = {
	title: string;
	description: string;
	href: string;
	icon: React.ComponentType<{ size: string | number }>;
};

type ReportCardProps = {
	report: ReportLink;
};

export function ReportCard({ report }: ReportCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const Icon = report.icon;

	return (
		<Card
			component={Link}
			href={report.href}
			withBorder
			shadow='sm'
			padding='lg'
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Flex gap='md' align='flex-start'>
				<ThemeIcon variant='light' size='xl' radius='md'>
					<Icon size='1.2rem' />
				</ThemeIcon>
				<Box style={{ flex: 1 }}>
					<Text fw={600} size='sm'>
						{report.title}
					</Text>
					<Text size='xs' c='dimmed' mt={4} lineClamp={2}>
						{report.description}
					</Text>
				</Box>
				<Stack justify='center' h='100%'>
					<IconChevronRight
						size={16}
						style={{
							transition: 'transform 0.2s ease',
							transform: isHovered ? 'translateX(4px)' : 'translateX(0px)',
							opacity: 0.5,
						}}
					/>
				</Stack>
			</Flex>
		</Card>
	);
}
