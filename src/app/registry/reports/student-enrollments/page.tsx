'use client';

import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconChartDonut, IconReportAnalytics } from '@tabler/icons-react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import { ReportCard, type ReportLink } from '@/shared/ui/adease';

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
