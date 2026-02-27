'use client';

import { ActionIcon, Group } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { deleteDocument, uploadDocument } from '@/core/integrations/storage';
import PhotoInputModal from '@/shared/ui/PhotoInputModal';

type Props = {
	selectedPhoto: File | null;
	photoPreview: string | null;
	onPhotoChange: (file: File | null, preview: string | null) => void;
	employeeNumber: string;
	existingPhotoUrl: string | null | undefined;
	compact?: boolean;
};

export default function PhotoSelection({
	selectedPhoto: _selectedPhoto,
	photoPreview,
	onPhotoChange,
	employeeNumber,
	existingPhotoUrl,
	compact: _compact = false,
}: Props) {
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		if (existingPhotoUrl && !photoPreview) {
			onPhotoChange(null, existingPhotoUrl);
		}
	}, [existingPhotoUrl, onPhotoChange, photoPreview]);

	const handlePhotoSubmit = async (croppedImageBlob: Blob) => {
		setIsUploading(true);
		try {
			if (existingPhotoUrl) {
				await deleteDocument(existingPhotoUrl);
			}

			const fileName = `${employeeNumber}.jpg`;
			const photoFile = new File([croppedImageBlob], fileName, {
				type: 'image/jpeg',
			});

			await uploadDocument(photoFile, fileName, 'photos/employees');

			const preview = URL.createObjectURL(croppedImageBlob);
			onPhotoChange(photoFile, preview);
		} catch (error) {
			console.error('Error uploading photo:', error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Group gap='xs'>
			<PhotoInputModal
				onPhotoSubmit={handlePhotoSubmit}
				title={`Upload Photo for Employee ${employeeNumber}`}
				renderTrigger={({ open }) => (
					<ActionIcon
						variant='light'
						size='lg'
						onClick={open}
						disabled={isUploading}
					>
						<IconPhoto size={18} />
					</ActionIcon>
				)}
			/>
		</Group>
	);
}
