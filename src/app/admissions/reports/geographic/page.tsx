'use client';

import {
	Button,
	Container,
	Grid,
	Loader,
	Paper,
	Stack,
	Table,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { IconDownload, IconMap, IconWorld } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AdmissionReportFilterComponent from '../_shared/AdmissionReportFilter';
import type { AdmissionReportFilter } from '../_shared/types';
import LesothoMap from './_components/LesothoMap';
import MapLegend from './_components/MapLegend';
import SouthernAfricaMap from './_components/SouthernAfricaMap';
import {
	exportGeographicExcel,
	getGeographicCountryData,
	getGeographicLocationData,
} from './_server/actions';

export default function GeographicPage() {
	const [filter, setFilter] = useState<AdmissionReportFilter>({});

	const { data: countries, isLoading: countriesLoading } = useQuery({
		queryKey: ['geographic-countries', filter],
		queryFn: () => getGeographicCountryData(filter),
	});

	const { data: locations, isLoading: locationsLoading } = useQuery({
		queryKey: ['geographic-locations', filter],
		queryFn: () => getGeographicLocationData(filter),
	});

	async function handleExport() {
		const base64 = await exportGeographicExcel(filter);
		const link = document.createElement('a');
		link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
		link.download = 'geographic-distribution.xlsx';
		link.click();
	}

	const maxCountry = Math.max(...(countries?.map((c) => c.count) ?? [1]));
	const maxLocation = Math.max(...(locations?.map((l) => l.count) ?? [1]));

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Geographic Distribution</Title>
				<Text c='dimmed' size='sm'>
					Application density maps for Southern Africa and Lesotho
				</Text>
				<AdmissionReportFilterComponent onFilterChange={setFilter} />
				<Tabs defaultValue='southern-africa'>
					<Tabs.List>
						<Tabs.Tab
							value='southern-africa'
							leftSection={<IconWorld size={16} />}
						>
							Southern Africa
						</Tabs.Tab>
						<Tabs.Tab value='lesotho' leftSection={<IconMap size={16} />}>
							Lesotho
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
					<Tabs.Panel value='southern-africa' pt='md'>
						{countriesLoading ? (
							<Loader />
						) : countries ? (
							<Grid>
								<Grid.Col span={{ base: 12, md: 8 }}>
									<Paper withBorder p='md'>
										<Stack>
											<SouthernAfricaMap data={countries} />
											<MapLegend maxCount={maxCountry} />
										</Stack>
									</Paper>
								</Grid.Col>
								<Grid.Col span={{ base: 12, md: 4 }}>
									<Paper withBorder p='md'>
										<Stack>
											<Title order={4}>By Country</Title>
											<Table striped highlightOnHover withTableBorder>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>Country</Table.Th>
														<Table.Th ta='right'>Applications</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{countries.map((c) => (
														<Table.Tr key={c.country}>
															<Table.Td>{c.country}</Table.Td>
															<Table.Td ta='right'>{c.count}</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Stack>
									</Paper>
								</Grid.Col>
							</Grid>
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='lesotho' pt='md'>
						{locationsLoading ? (
							<Loader />
						) : locations ? (
							<Grid>
								<Grid.Col span={{ base: 12, md: 8 }}>
									<Paper withBorder p='md'>
										<Stack>
											<LesothoMap data={locations} />
											<MapLegend maxCount={maxLocation} />
										</Stack>
									</Paper>
								</Grid.Col>
								<Grid.Col span={{ base: 12, md: 4 }}>
									<Paper withBorder p='md'>
										<Stack>
											<Title order={4}>By Location</Title>
											<Table striped highlightOnHover withTableBorder>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>Location</Table.Th>
														<Table.Th ta='right'>Applications</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{locations.map((l) => (
														<Table.Tr key={l.city}>
															<Table.Td>{l.city}</Table.Td>
															<Table.Td ta='right'>{l.count}</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Stack>
									</Paper>
								</Grid.Col>
							</Grid>
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
