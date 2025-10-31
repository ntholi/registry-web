'use client';

import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconChartBar, IconFilePencil, IconFileText } from '@tabler/icons-react';
import Link from 'next/link';
import { dashboardUsers } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';

export default function ReportsPage() {
	const departments = dashboardUsers.enumValues.filter(
		(dept: string) => dept !== 'admin' && dept !== 'resource'
	);

	return (
		<Stack>
			<Title order={2}>Reports</Title>
			<Text c="dimmed" size="sm">
				Generate various reports for the university
			</Text>

			<Title order={3} mt="lg">
				Academic Reports
			</Title>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				<Link href="/dashboard/reports/boe" style={{ textDecoration: 'none' }}>
					<Card withBorder shadow="sm" padding="lg" style={{ cursor: 'pointer' }}>
						<Stack gap="xs" align="center">
							<IconChartBar size={24} />
							<Text fw={500}>BOE Reports</Text>
							<Text size="sm" c="dimmed">
								Generate Board of Examination reports
							</Text>
						</Stack>
					</Card>
				</Link>

				<Link href="/dashboard/reports/course-summary" style={{ textDecoration: 'none' }}>
					<Card withBorder shadow="sm" padding="lg" style={{ cursor: 'pointer' }}>
						<Stack gap="xs" align="center">
							<IconFileText size={24} />
							<Text fw={500}>Course Summary Reports</Text>
							<Text size="sm" c="dimmed">
								Generate course summary reports
							</Text>
						</Stack>
					</Card>
				</Link>
			</SimpleGrid>

			<Title order={3} mt="lg">
				Registry Reports
			</Title>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				<Link href="/dashboard/reports/registration" style={{ textDecoration: 'none' }}>
					<Card withBorder shadow="sm" padding="lg" style={{ cursor: 'pointer' }}>
						<Stack gap="xs" align="center">
							<IconFileText size={24} />
							<Text fw={500}>Registration Reports</Text>
							<Text size="sm" c="dimmed">
								Generate student registration reports
							</Text>
						</Stack>
					</Card>
				</Link>
			</SimpleGrid>

			<Title order={3} mt="lg">
				Clearance Reports
			</Title>
			<Text c="dimmed" size="sm">
				Select a department to view clearance statistics
			</Text>

			<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
				{departments.map((dept) => (
					<Link
						key={dept}
						href={`/dashboard/reports/clearance/${dept}`}
						style={{ textDecoration: 'none' }}
					>
						<Card withBorder shadow="sm" padding="lg" style={{ cursor: 'pointer' }}>
							<Stack gap="xs" align="center">
								<IconFilePencil size={24} />
								<Text fw={500}>{toTitleCase(dept)} Department</Text>
								<Text size="sm" c="dimmed">
									View clearance statistics
								</Text>
							</Stack>
						</Card>
					</Link>
				))}
			</SimpleGrid>
		</Stack>
	);
}
