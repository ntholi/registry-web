'use client';

import { Alert, Container, Stack, Tabs, Title } from '@mantine/core';
import { IconChartBar, IconEye, IconMessageDots } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Filter from './_components/Filter';
import ObservationTab from './_components/ObservationTab';
import OverviewTab from './_components/OverviewTab';
import StudentFeedbackTab from './_components/StudentFeedbackTab';
import type { ReportFilter } from './_lib/types';
import { getReportAccessInfo } from './_server/actions';

type TabValue = 'overview' | 'feedback' | 'observation';

export default function AppraisalReportsPage() {
	const [filter, setFilter] = useState<ReportFilter>({});
	const [activeTab, setActiveTab] = useState<TabValue>('overview');

	const { data: access } = useQuery({
		queryKey: ['appraisal-report-access'],
		queryFn: getReportAccessInfo,
	});

	const hasFeedback = access?.hasFeedbackAccess ?? false;
	const hasObservation = access?.hasObservationAccess ?? false;
	const hasAny = hasFeedback || hasObservation;
	const title = access?.hasFullAccess
		? 'Appraisal Reports'
		: 'My Appraisal Results';

	return (
		<Container size='xl' py='md'>
			<Stack gap='lg'>
				<Title order={2}>{title}</Title>
				<Filter
					onFilterChange={setFilter}
					activeTab={activeTab}
					hasFullAccess={access?.hasFullAccess ?? false}
				/>
				{!filter.termId ? (
					<Alert color='blue' title='Select a term'>
						Please select a term to view appraisal data.
					</Alert>
				) : (
					<Tabs
						value={activeTab}
						onChange={(v) => setActiveTab((v as TabValue) ?? 'overview')}
					>
						<Tabs.List>
							{hasAny && (
								<Tabs.Tab
									value='overview'
									leftSection={<IconChartBar size={16} />}
								>
									Overview
								</Tabs.Tab>
							)}
							{hasFeedback && (
								<Tabs.Tab
									value='feedback'
									leftSection={<IconMessageDots size={16} />}
								>
									Student Feedback
								</Tabs.Tab>
							)}
							{hasObservation && (
								<Tabs.Tab
									value='observation'
									leftSection={<IconEye size={16} />}
								>
									Teaching Observation
								</Tabs.Tab>
							)}
						</Tabs.List>

						{hasAny && (
							<Tabs.Panel value='overview' pt='md'>
								<OverviewTab filter={filter} />
							</Tabs.Panel>
						)}
						{hasFeedback && (
							<Tabs.Panel value='feedback' pt='md'>
								<StudentFeedbackTab filter={filter} />
							</Tabs.Panel>
						)}
						{hasObservation && (
							<Tabs.Panel value='observation' pt='md'>
								<ObservationTab filter={filter} />
							</Tabs.Panel>
						)}
					</Tabs>
				)}
			</Stack>
		</Container>
	);
}
