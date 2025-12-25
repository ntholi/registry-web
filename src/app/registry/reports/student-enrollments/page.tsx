'use client';

import {
	Box,
	Card,
	Flex,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconChartDonut,
	IconChevronRight,
	IconReportAnalytics,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';

type ReportLink = {
	title: string;
	description: string;
	href: string;
	icon: React.ComponentType<{ size: string | number }>;
};

const reports: ReportLink[] = [
	{
		title: 'Student Enrollments',
		description:
			'View detailed student enrollment data by semester, program, and status',
		href: '/registry/reports/student-enrollments/enrollments',
		icon: IconReportAnalytics,
	},
	{
		title: 'Enrollment Distribution',
		description:
			'Visualize enrollment distribution with interactive charts and graphs',
		href: '/registry/reports/student-enrollments/distribution',
		icon: IconChartDonut,
	},
];

export default function EnrollmentReportsPage() {
	const { activeTerm } = useActiveTerm();

	function buildHref(baseHref: string) {
		if (activeTerm?.id) {
			return `${baseHref}?termId=${activeTerm.id}`;
		}
		return baseHref;
	}

	return (
		<Stack p='lg'>
			<Title order={2}>Enrollment Reports</Title>
			<Text c='dimmed' size='sm'>
				Select a report type to view enrollment data and analytics
			</Text>

			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mt='md'>
				{reports.map((report) => (
					<ReportCard
						key={report.href}
						report={{ ...report, href: buildHref(report.href) }}
					/>
				))}
			</SimpleGrid>
		</Stack>
	);
}

type ReportCardProps = {
	report: ReportLink;
};

function ReportCard({ report }: ReportCardProps) {
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
