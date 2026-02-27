'use client';

import {
	Card,
	Group,
	Skeleton,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import IDCardPreview from '@/shared/ui/IDCardPreview';
import { type getEmployee, getEmployeePhoto } from '../../_server/actions';
import PhotoSelection from './PhotoSelection';
import PrintHistoryView from './PrintHistoryView';

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
	isActive: boolean;
};

export default function EmployeeCardView({ employee, isActive }: Props) {
	const [activeTab, setActiveTab] = useState<string | null>('preview');
	const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);

	const { data: existingPhotoUrl, isLoading } = useQuery({
		queryKey: ['employee-photo', employee.empNo],
		queryFn: () => getEmployeePhoto(employee.empNo),
		staleTime: 1000 * 60 * 3,
		enabled: isActive,
	});

	const finalPhotoUrl = photoPreview || existingPhotoUrl;

	const handlePhotoChange = (file: File | null, preview: string | null) => {
		setSelectedPhoto(file);
		setPhotoPreview(preview);
	};

	if (!isActive) return null;

	return (
		<Stack>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Group gap='xs'>
							{isLoading ? (
								<Skeleton height={20} width={100} />
							) : finalPhotoUrl ? (
								<Text fw={500} size='sm'>
									Employee Card
								</Text>
							) : (
								<Text size='xs' c='dimmed' fs='italic'>
									(No photo)
								</Text>
							)}
						</Group>
						<Text size='xs' c='dimmed'>
							Manage employee card photo and print history
						</Text>
					</Stack>
					<Group gap='xs'>
						<PhotoSelection
							selectedPhoto={selectedPhoto}
							photoPreview={photoPreview}
							onPhotoChange={handlePhotoChange}
							employeeNumber={employee.empNo}
							existingPhotoUrl={existingPhotoUrl}
							compact
						/>
					</Group>
				</Group>
			</Card>

			<Tabs value={activeTab} onChange={setActiveTab} variant='default'>
				<TabsList>
					<TabsTab value='preview'>Preview</TabsTab>
					<TabsTab value='history'>History</TabsTab>
				</TabsList>
				<TabsPanel value='preview' pt='xl'>
					<IDCardPreview
						photoUrl={finalPhotoUrl}
						fields={[
							{ value: employee.name },
							{ value: employee.empNo },
							{ value: employee.department ?? 'N/A' },
							{ value: (employee.type ?? 'STAFF').toUpperCase() },
							{ value: String(new Date().getFullYear()) },
						]}
					/>
				</TabsPanel>
				<TabsPanel value='history' pt='xl'>
					<PrintHistoryView
						empNo={employee.empNo}
						isActive={isActive && activeTab === 'history'}
					/>
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
