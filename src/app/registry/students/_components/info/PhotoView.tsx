'use client';
import { ActionIcon, Card, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconUpload, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/core/auth-client';
import type { ActionData } from '@/shared/lib/utils/actionResult';
import PhotoInputModal from '@/shared/ui/PhotoInputModal';
import PhotoPreviewModal from '@/shared/ui/PhotoPreviewModal';
import {
	type getStudent,
	getStudentPhoto,
	uploadStudentPhoto,
} from '../../_server/actions';

type Props = {
	student: NonNullable<ActionData<typeof getStudent>>;
};

export default function PhotoView({ student }: Props) {
	const { data: photoUrl, refetch } = useQuery({
		queryKey: ['student-photo', student.stdNo],
		queryFn: () => getStudentPhoto(student.stdNo),
		staleTime: 1000 * 60 * 3,
	});
	const { data: session } = authClient.useSession();

	const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
		try {
			const photoFile = new File([croppedImageBlob], `${student.stdNo}.jpg`, {
				type: 'image/jpeg',
			});

			await uploadStudentPhoto(student.stdNo, photoFile);
			await refetch();

			notifications.show({
				title: 'Success',
				message: 'Photo updated successfully',
				color: 'green',
			});
		} catch (_error) {
			notifications.show({
				title: 'Error',
				message: 'Failed to update photo',
				color: 'red',
			});
		}
	};

	const canEditPhoto = ['admin', 'registry'].includes(
		session?.user?.role ?? ''
	);

	const cardContent = (
		<Center h='100%'>
			<IconUser size='2rem' />
		</Center>
	);

	return (
		<div style={{ position: 'relative' }}>
			{photoUrl ? (
				<>
					<PhotoPreviewModal
						photoUrl={photoUrl}
						title={`${student.name} (${student.stdNo})`}
						alt='Student photo'
						width={76}
						height={76}
					/>
					{canEditPhoto && (
						<div
							style={{
								position: 'absolute',
								top: 2,
								right: 2,
								display: 'flex',
								gap: '4px',
								zIndex: 2,
							}}
						>
							<PhotoInputModal
								onPhotoSubmit={handlePhotoSubmit}
								title={`Change Photo for ${student.name}`}
								renderTrigger={({ open }) => (
									<ActionIcon
										size='sm'
										variant='default'
										color='blue'
										style={{ opacity: 0.8 }}
										onClick={open}
										title='Change photo'
									>
										<IconEdit size='0.7rem' />
									</ActionIcon>
								)}
							/>
						</div>
					)}
				</>
			) : (
				<>
					<Card withBorder radius={'md'} w={76} h={76} p={'xs'}>
						{cardContent}
					</Card>
					{canEditPhoto && (
						<PhotoInputModal
							onPhotoSubmit={handlePhotoSubmit}
							title={`Upload Photo for ${student.name}`}
							renderTrigger={({ open }) => (
								<ActionIcon
									size='sm'
									style={{
										position: 'absolute',
										opacity: 0.7,
										top: 4,
										right: 4,
										zIndex: 1,
									}}
									onClick={open}
									title='Upload photo'
								>
									<IconUpload size='0.8rem' />
								</ActionIcon>
							)}
						/>
					)}
				</>
			)}
		</div>
	);
}
