'use client';
import {
	Button,
	Card,
	CardSection,
	Group,
	Loader,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useUserSchools } from '@/hooks/use-user-schools';
import { generateBoeReportForFaculty } from '@/server/reports/boe/actions';
import { getSchools } from '@/server/semester-modules/actions';

export default function Body() {
	const [isDownloading, setIsDownloading] = useState(false);
	const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
	const { data: schools, isLoading: schoolsLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getSchools,
	});
	const { currentTerm } = useCurrentTerm();
	const { userSchools, isLoading: userSchoolsLoading } = useUserSchools();

	React.useEffect(() => {
		if (!selectedSchoolId && userSchools.length > 0) {
			setSelectedSchoolId(userSchools[0].school.id.toString());
		}
	}, [userSchools, selectedSchoolId]);

	const generateReportMutation = useMutation({
		mutationFn: async () => {
			if (!selectedSchoolId) {
				throw new Error('Please select a school');
			}
			setIsDownloading(true);
			try {
				const result = await generateBoeReportForFaculty(
					schools?.find((s) => s.id === Number(selectedSchoolId))
				);
				if (!result.success) {
					throw new Error(result.error || 'Failed to generate report');
				}
				return result.data;
			} finally {
				setIsDownloading(false);
			}
		},
		onSuccess: (base64Data) => {
			if (!base64Data) {
				throw new Error('No data received from server');
			}
			const binaryString = window.atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const selectedSchool = schools?.find((s) => s.id === Number(selectedSchoolId));
			const schoolCode = selectedSchool?.code || 'School';
			a.download = `${schoolCode}_BOE_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			document.body.removeChild(a);
		},
		onError: (error) => {
			console.error('Error generating BOE report:', error);
			notifications.show({
				title: 'Error',
				message: `Error generating BOE report: ${error.message}`,
				color: 'red',
			});
		},
	});

	const schoolOptions =
		schools?.map((school) => ({
			value: school.id.toString(),
			label: school.name,
		})) || [];

	return (
		<Stack align='center' justify='center' p='xl'>
			<Card shadow='md' radius='md' withBorder w='100%' maw={600}>
				<CardSection inheritPadding py='md'>
					<Title order={3}>BOE Report Generation</Title>
					<Text c='dimmed' size='sm'>
						Generate Board of Examination (BOE) reports
					</Text>
				</CardSection>
				<CardSection inheritPadding>
					<Stack gap='md'>
						<Text my='xs'>
							Select a school to generate BOE reports for all programs and students in that school
							for {currentTerm?.name}.
						</Text>

						<Select
							label='Select School'
							placeholder='Choose a school'
							data={schoolOptions}
							value={selectedSchoolId}
							onChange={setSelectedSchoolId}
							disabled={schoolsLoading || userSchoolsLoading}
							searchable
						/>
					</Stack>
				</CardSection>
				<CardSection inheritPadding py='md'>
					<Group>
						<Button
							fullWidth
							onClick={() => generateReportMutation.mutate()}
							disabled={!selectedSchoolId || generateReportMutation.isPending || isDownloading}
							leftSection={
								generateReportMutation.isPending || isDownloading ? <Loader size={16} /> : null
							}
						>
							{generateReportMutation.isPending || isDownloading
								? 'Generating Reports...'
								: 'Generate Reports'}
						</Button>
					</Group>
				</CardSection>
			</Card>
		</Stack>
	);
}
