'use client';

import {
	Button,
	Container,
	Loader,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { IconChartDonut, IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AdmissionReportFilterComponent from '../_shared/AdmissionReportFilter';
import type { AdmissionReportFilter } from '../_shared/types';
import OverviewCharts from './_components/OverviewCharts';
import {
	exportDemographicsExcel,
	getDemographicsOverview,
} from './_server/actions';

export default function DemographicsPage() {
	const [filter, setFilter] = useState<AdmissionReportFilter>({});

	const { data: overview, isLoading: overviewLoading } = useQuery({
		queryKey: ['demographics-overview', filter],
		queryFn: () => getDemographicsOverview(filter),
	});

	async function handleExport() {
		const base64 = await exportDemographicsExcel(filter);
		const link = document.createElement('a');
		link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
		link.download = 'demographics.xlsx';
		link.click();
	}

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Applicant Demographics</Title>
				<Text c='dimmed' size='sm'>
					Gender, nationality, and age group analysis
				</Text>
				<AdmissionReportFilterComponent onFilterChange={setFilter} />
				<Tabs defaultValue='overview'>
					<Tabs.List>
						<Tabs.Tab
							value='overview'
							leftSection={<IconChartDonut size={16} />}
						>
							Overview
						</Tabs.Tab>
						<Button
							variant='light'
							size='compact-sm'
							ml='auto'
							leftSection={<IconDownload size={16} />}
							onClick={handleExport}
						>
							Export Excel
						</Button>
					</Tabs.List>
					<Tabs.Panel value='overview' pt='md'>
						{overviewLoading ? (
							<Loader />
						) : overview ? (
							<OverviewCharts data={overview} />
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
