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
import {
	IconChartBar,
	IconDownload,
	IconListNumbers,
	IconSchool,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AdmissionReportFilterComponent from '../_shared/AdmissionReportFilter';
import type { AdmissionReportFilter } from '../_shared/types';
import ChoiceComparison from './_components/ChoiceComparison';
import ProgramRanking from './_components/ProgramRanking';
import SchoolDemand from './_components/SchoolDemand';
import {
	exportProgramDemandExcel,
	getProgramDemandBySchool,
	getProgramDemandData,
} from './_server/actions';

export default function ProgramDemandPage() {
	const [filter, setFilter] = useState<AdmissionReportFilter>({});

	const { data: demand, isLoading: demandLoading } = useQuery({
		queryKey: ['program-demand', filter],
		queryFn: () => getProgramDemandData(filter),
	});

	const { data: bySchool, isLoading: schoolLoading } = useQuery({
		queryKey: ['program-demand-school', filter],
		queryFn: () => getProgramDemandBySchool(filter),
	});

	async function handleExport() {
		const base64 = await exportProgramDemandExcel(filter);
		const link = document.createElement('a');
		link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
		link.download = 'program-demand.xlsx';
		link.click();
	}

	const loading = demandLoading || schoolLoading;

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Program Demand</Title>
				<Text c='dimmed' size='sm'>
					Most popular programs, first vs second choice comparison
				</Text>
				<AdmissionReportFilterComponent
					onFilterChange={setFilter}
				/>
				<Tabs defaultValue='ranking'>
					<Tabs.List>
						<Tabs.Tab
							value='ranking'
							leftSection={<IconListNumbers size={16} />}
						>
							Ranking
						</Tabs.Tab>
						<Tabs.Tab
							value='comparison'
							leftSection={<IconChartBar size={16} />}
						>
							First vs Second
						</Tabs.Tab>
						<Tabs.Tab value='school' leftSection={<IconSchool size={16} />}>
							By School
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
					<Tabs.Panel value='ranking' pt='md'>
						{loading ? (
							<Loader />
						) : demand ? (
							<ProgramRanking data={demand} />
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='comparison' pt='md'>
						{loading ? (
							<Loader />
						) : demand ? (
							<ChoiceComparison data={demand} />
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='school' pt='md'>
						{loading ? (
							<Loader />
						) : bySchool ? (
							<SchoolDemand data={bySchool} />
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
