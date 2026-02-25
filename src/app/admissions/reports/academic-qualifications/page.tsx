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
	IconBuildingCommunity,
	IconCertificate,
	IconDownload,
	IconLetterA,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import AdmissionReportFilterComponent from '../_shared/AdmissionReportFilter';
import type { AdmissionReportFilter } from '../_shared/types';
import CertificateChart from './_components/CertificateChart';
import ClassificationChart from './_components/ClassificationChart';
import GradeChart from './_components/GradeChart';
import OriginSchools from './_components/OriginSchools';
import {
	exportQualificationsExcel,
	getCertificateDistribution,
	getGradeDistribution,
	getResultClassification,
	getTopOriginSchools,
} from './_server/actions';

export default function AcademicQualificationsPage() {
	const [filter, setFilter] = useState<AdmissionReportFilter>({});

	const { data: certs, isLoading: certsLoading } = useQuery({
		queryKey: ['academic-cert-dist', filter],
		queryFn: () => getCertificateDistribution(filter),
	});

	const { data: grades, isLoading: gradesLoading } = useQuery({
		queryKey: ['academic-grade-dist', filter],
		queryFn: () => getGradeDistribution(filter),
	});

	const { data: classifications, isLoading: classLoading } = useQuery({
		queryKey: ['academic-classifications', filter],
		queryFn: () => getResultClassification(filter),
	});

	const { data: originSchools, isLoading: originLoading } = useQuery({
		queryKey: ['academic-origin-schools', filter],
		queryFn: () => getTopOriginSchools(filter),
	});

	async function handleExport() {
		const base64 = await exportQualificationsExcel(filter);
		const link = document.createElement('a');
		link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
		link.download = 'academic-qualifications.xlsx';
		link.click();
	}

	return (
		<Container size='xl' p={{ base: 'sm', sm: 'xl' }}>
			<Stack>
				<Title order={2}>Academic Qualifications</Title>
				<Text c='dimmed' size='sm'>
					Certificate types, grade distribution, and result classifications
				</Text>
				<AdmissionReportFilterComponent onFilterChange={setFilter} />
				<Tabs defaultValue='certificates'>
					<Tabs.List>
						<Tabs.Tab
							value='certificates'
							leftSection={<IconCertificate size={16} />}
						>
							Certificates
						</Tabs.Tab>
						<Tabs.Tab value='results' leftSection={<IconLetterA size={16} />}>
							Grades & Classifications
						</Tabs.Tab>
						<Tabs.Tab
							value='origin-schools'
							leftSection={<IconBuildingCommunity size={16} />}
						>
							Origin Schools
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
					<Tabs.Panel value='certificates' pt='md'>
						{certsLoading ? (
							<Loader />
						) : certs ? (
							<CertificateChart data={certs} />
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='results' pt='md'>
						{gradesLoading || classLoading ? (
							<Loader />
						) : grades && classifications ? (
							<Stack>
								<GradeChart data={grades} />
								<ClassificationChart data={classifications} />
							</Stack>
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='origin-schools' pt='md'>
						{originLoading ? (
							<Loader />
						) : originSchools ? (
							<OriginSchools data={originSchools} />
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
