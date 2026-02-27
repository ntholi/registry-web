'use client';
import { ActionIcon, Card, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconUpload, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import PhotoInputModal from '@/shared/ui/PhotoInputModal';
import PhotoPreviewModal from '@/shared/ui/PhotoPreviewModal';
import { type getEmployee, getEmployeePhoto } from '../../_server/actions';

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function PhotoView({ employee }: Props) {
	const { data: photoUrl, refetch } = useQuery({
		queryKey: ['employee-photo', employee.empNo],
		queryFn: () => getEmployeePhoto(employee.empNo),
		staleTime: 1000 * 60 * 3,
	});
	const { data: session } = useSession();

	const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
		try {
			if (photoUrl) {
				await deleteDocument(photoUrl);
			}

			const fileName = `${employee.empNo}.jpg`;
			const photoFile = new File([croppedImageBlob], fileName, {
				type: 'image/jpeg',
			});

			await uploadDocument(photoFile, fileName, 'photos/employees');
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

	const canEditPhoto = ['admin', 'human_resource'].includes(
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
						title={`${employee.name} (${employee.empNo})`}
						alt='Employee photo'
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
								title={`Change Photo for ${employee.name}`}
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
					<Card withBorder radius='md' w={76} h={76} p='xs'>
						{cardContent}
					</Card>
					{canEditPhoto && (
						<PhotoInputModal
							onPhotoSubmit={handlePhotoSubmit}
							title={`Upload Photo for ${employee.name}`}
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
