'use client';

import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
	IconCertificate,
	IconChartBar,
	IconChartDonut,
	IconMap,
	IconUsers,
} from '@tabler/icons-react';
import { ReportCard, type ReportLink } from '@/shared/ui/adease';

const reports: ReportLink[] = [
	{
		title: 'Application Summary',
		description: 'Application status breakdown by school and program',
		href: '/admissions/reports/application-summary',
		icon: IconChartBar,
	},
	{
		title: 'Applicant Demographics',
		description: 'Gender, nationality, and age group analysis',
		href: '/admissions/reports/demographics',
		icon: IconUsers,
	},
	{
		title: 'Geographic Distribution',
		description: 'Maps showing application density by region',
		href: '/admissions/reports/geographic',
		icon: IconMap,
	},
	{
		title: 'Program Demand',
		description: 'Most popular programs and first vs second choice analysis',
		href: '/admissions/reports/program-demand',
		icon: IconChartDonut,
	},
	{
		title: 'Academic Qualifications',
		description: 'Certificate type distribution and grade analysis',
		href: '/admissions/reports/academic-qualifications',
		icon: IconCertificate,
	},
];

export default function AdmissionReportsPage() {
	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Admissions Reports</Title>
				<Text c='dimmed' size='sm'>
					Select a report to view admissions data and analytics
				</Text>
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mt='md'>
					{reports.map((report) => (
						<ReportCard key={report.href} report={report} />
					))}
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
