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
import { IconChartBar, IconDownload, IconTable } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AdmissionReportFilterComponent from '../_shared/AdmissionReportFilter';
import type { AdmissionReportFilter } from '../_shared/types';
import StatusCharts from './_components/StatusCharts';
import SummaryTable from './_components/SummaryTable';
import {
	exportApplicationSummaryExcel,
	getApplicationChartData,
	getApplicationSummary,
} from './_server/actions';

export default function ApplicationSummaryPage() {
	const [filter, setFilter] = useState<AdmissionReportFilter>({});

	const { data: summaryData, isLoading: summaryLoading } = useQuery({
		queryKey: ['application-summary', filter],
		queryFn: () => getApplicationSummary(filter),
	});

	const { data: chartData, isLoading: chartLoading } = useQuery({
		queryKey: ['application-chart-data', filter],
		queryFn: () => getApplicationChartData(filter),
	});

	async function handleExport() {
		const base64 = await exportApplicationSummaryExcel(filter);
		const link = document.createElement('a');
		link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
		link.download = 'application-summary.xlsx';
		link.click();
	}

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Application Summary</Title>
				<Text c='dimmed' size='sm'>
					Application status breakdown by school and program
				</Text>
				<AdmissionReportFilterComponent onFilterChange={setFilter} />
				<Tabs defaultValue='summary'>
					<Tabs.List>
						<Tabs.Tab value='summary' leftSection={<IconTable size={16} />}>
							Summary
						</Tabs.Tab>
						<Tabs.Tab value='charts' leftSection={<IconChartBar size={16} />}>
							Charts
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
					<Tabs.Panel value='summary' pt='md'>
						{summaryLoading ? (
							<Loader />
						) : summaryData ? (
							<SummaryTable data={summaryData} />
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='charts' pt='md'>
						{chartLoading ? (
							<Loader />
						) : chartData ? (
							<StatusCharts data={chartData} />
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
