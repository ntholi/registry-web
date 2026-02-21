'use client';

import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconSchool, IconTrendingUp } from '@tabler/icons-react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import { ReportCard, type ReportLink } from '@/shared/ui/adease';

const reports: ReportLink[] = [
	{
		title: 'Graduations',
		description:
			'View detailed graduation records by term, school, and program',
		href: '/registry/reports/graduations/student-graduations',
		icon: IconSchool,
	},
	{
		title: 'Graduation Trends',
		description:
			'Analyze graduation trends and patterns across different dates',
		href: '/registry/reports/graduations/trends',
		icon: IconTrendingUp,
	},
];

export default function GraduationReportsPage() {
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
				<Title order={2}>Graduation Reports</Title>
				<Text c='dimmed' size='sm'>
					Select a report type to view graduation data and analytics
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
