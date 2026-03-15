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
import type { ActionData } from '@/shared/lib/utils/actionResult';
import IDCardPreview from '@/shared/ui/IDCardPreview';
import { type getStudent, getStudentPhoto } from '../../_server/actions';
import PhotoSelection from './PhotoSelection';
import PrintHistoryView from './PrintHistoryView';

type StudentCardViewProps = {
	student: NonNullable<ActionData<typeof getStudent>>;
	isActive: boolean;
};

export default function StudentCardView({
	student,
	isActive,
}: StudentCardViewProps) {
	const [activeTab, setActiveTab] = useState<string | null>('preview');
	const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);

	const { data: existingPhotoUrl, isLoading } = useQuery({
		queryKey: ['student-photo', student.stdNo],
		queryFn: () => getStudentPhoto(student.stdNo),
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
									Student Card
								</Text>
							) : (
								<Text size='xs' c='dimmed' fs='italic'>
									(No photo)
								</Text>
							)}
						</Group>
						<Text size='xs' c='dimmed'>
							Manage student card photo and print history
						</Text>
					</Stack>
					<Group gap='xs'>
						<PhotoSelection
							selectedPhoto={selectedPhoto}
							photoPreview={photoPreview}
							onPhotoChange={handlePhotoChange}
							studentNumber={student.stdNo}
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
							{ value: student.name },
							{ value: String(student.stdNo) },
							{
								value:
									student.programs?.find((p) => p.status === 'Active')
										?.structure?.program?.code || 'N/A',
							},
							{ value: 'STUDENT' },
							{ value: String(new Date().getFullYear()) },
						]}
					/>
				</TabsPanel>
				<TabsPanel value='history' pt='xl'>
					<PrintHistoryView
						stdNo={student.stdNo}
						isActive={isActive && activeTab === 'history'}
					/>
				</TabsPanel>
			</Tabs>
		</Stack>
	);
}
