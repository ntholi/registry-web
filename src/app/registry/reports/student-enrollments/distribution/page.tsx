'use client';
import { Alert, Box, Container, Stack, Text, Title } from '@mantine/core';
import {
	DistributionCharts,
	DistributionFilter,
	type DistributionReportFilter,
	type DistributionType,
} from '@registry/reports';
import { IconInfoCircle } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

export default function DistributionReportPage() {
	const [filter, setFilter] = useState<DistributionReportFilter>({});
	const [distributionType, setDistributionType] =
		useState<DistributionType | null>(null);

	const handleFilterChange = useCallback(
		(newFilter: DistributionReportFilter, type: DistributionType | null) => {
			setFilter(newFilter);
			setDistributionType(type);
		},
		[]
	);

	const isFilterApplied = Boolean(
		filter.termIds && filter.termIds.length > 0 && distributionType
	);

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Box>
					<Title order={1} size='h2'>
						Distribution Reports
					</Title>
					<Text c='dimmed' size='sm'>
						Analyze how student data is distributed across different dimensions
					</Text>
				</Box>

				<DistributionFilter onFilterChange={handleFilterChange} />

				{!isFilterApplied && (
					<Alert
						icon={<IconInfoCircle size={16} />}
						color='blue'
						variant='light'
					>
						Select an academic term and a distribution type to generate the
						report. Optionally filter by school, program, or semester.
					</Alert>
				)}

				{isFilterApplied && (
					<DistributionCharts
						filter={filter}
						distributionType={distributionType}
					/>
				)}
			</Stack>
		</Container>
	);
}
