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
	IconAward,
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
import {
	exportQualificationsExcel,
	getCertificateDistribution,
	getGradeDistribution,
	getResultClassification,
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
						<Tabs.Tab value='grades' leftSection={<IconLetterA size={16} />}>
							Grades
						</Tabs.Tab>
						<Tabs.Tab
							value='classifications'
							leftSection={<IconAward size={16} />}
						>
							Classifications
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
					<Tabs.Panel value='grades' pt='md'>
						{gradesLoading ? (
							<Loader />
						) : grades ? (
							<GradeChart data={grades} />
						) : null}
					</Tabs.Panel>
					<Tabs.Panel value='classifications' pt='md'>
						{classLoading ? (
							<Loader />
						) : classifications ? (
							<ClassificationChart data={classifications} />
						) : null}
					</Tabs.Panel>
				</Tabs>
			</Stack>
		</Container>
	);
}
