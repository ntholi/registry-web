'use client';

import {
	Box,
	Card,
	Container,
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
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';

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
		href: '/reports/registry/student-enrollments/enrollments',
		icon: IconReportAnalytics,
	},
	{
		title: 'Enrollment Distribution',
		description:
			'Visualize enrollment distribution with interactive charts and graphs',
		href: '/reports/registry/student-enrollments/distribution',
		icon: IconChartDonut,
	},
];

export default function EnrollmentReportsPage() {
	const { activeTerm } = useActiveTerm();
	const { userSchools } = useUserSchools();

	function buildHref(baseHref: string) {
		const params = new URLSearchParams();
		if (activeTerm?.id) {
			params.set('termId', activeTerm.id.toString());
		}
		if (userSchools.length > 0) {
			for (const it of userSchools) {
				params.append('schoolIds', it.schoolId.toString());
			}
		}
		const queryString = params.toString();
		return queryString ? `${baseHref}?${queryString}` : baseHref;
	}

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
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
		</Container>
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
