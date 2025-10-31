'use client';

import {
	ActionIcon,
	Box,
	Button,
	Group,
	Image,
	Modal,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCamera, IconPhoto, IconTrashFilled, IconVideo } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDocument, uploadDocument } from '@/lib/storage';
import PhotoInputModal from '../info/PhotoInputModal';

type PhotoSelectionProps = {
	selectedPhoto: File | null;
	photoPreview: string | null;
	onPhotoChange: (file: File | null, preview: string | null) => void;
	studentNumber: number;
	existingPhotoUrl: string | null | undefined;
};

export default function PhotoSelection({
	selectedPhoto: _selectedPhoto,
	photoPreview,
	onPhotoChange,
	studentNumber,
	existingPhotoUrl,
}: PhotoSelectionProps) {
	const [cameraOpened, { open: openCamera, close: closeCamera }] = useDisclosure(false);

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

			const fileName = `${studentNumber}.jpg`;
			const photoFile = new File([croppedImageBlob], fileName, {
				type: 'image/jpeg',
			});

			await uploadDocument(photoFile, fileName, 'photos');

			const preview = URL.createObjectURL(croppedImageBlob);
			onPhotoChange(photoFile, preview);
		} catch (error) {
			console.error('Error uploading photo:', error);
		} finally {
			setIsUploading(false);
		}
	};

	const handleCameraCapture = async (capturedFile: File, preview: string) => {
		setIsUploading(true);
		try {
			if (existingPhotoUrl) {
				await deleteDocument(existingPhotoUrl);
			}

			const fileExtension = capturedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
			const fileName = `${studentNumber}.${fileExtension}`;

			await uploadDocument(capturedFile, fileName, 'photos');
			onPhotoChange(capturedFile, preview);
		} catch (error) {
			console.error('Error uploading photo:', error);
		} finally {
			setIsUploading(false);
		}
		closeCamera();
	};

	return (
		<Paper p='lg' withBorder>
			<Text fw={600} mb='md'>
				Photo Selection
			</Text>

			<Stack gap='md'>
				<Group>
					<PhotoInputModal
						onPhotoSubmit={handlePhotoSubmit}
						title={`Upload Photo for Student ${studentNumber}`}
						renderTrigger={({ open }) => (
							<Button
								onClick={open}
								style={{ flex: 1 }}
								leftSection={<IconPhoto size={16} />}
								disabled={isUploading}
								variant='light'
							>
								Select Photo
							</Button>
						)}
					/>
					<ActionIcon variant='light' size={'lg'} onClick={openCamera} disabled={isUploading}>
						<IconCamera size={16} />
					</ActionIcon>
				</Group>

				{isUploading && (
					<Text size='sm' c='blue'>
						Uploading photo...
					</Text>
				)}

				{photoPreview && (
					<Box mt={'md'}>
						<Box pos='relative'>
							<Image
								src={photoPreview}
								alt='Student photo preview'
								w='100%'
								h={250}
								fit='cover'
								radius='md'
							/>
							<ActionIcon
								color='red'
								onClick={() => onPhotoChange(null, null)}
								pos='absolute'
								top={5}
								right={5}
							>
								<IconTrashFilled size={16} />
							</ActionIcon>
						</Box>
					</Box>
				)}
			</Stack>

			<CameraModal opened={cameraOpened} onClose={closeCamera} onCapture={handleCameraCapture} />
		</Paper>
	);
}

type CameraModalProps = {
	opened: boolean;
	onClose: () => void;
	onCapture: (file: File, preview: string) => void;
};

type CameraDevice = {
	deviceId: string;
	label: string;
	groupId: string;
};

function CameraModal({ opened, onClose, onCapture }: CameraModalProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
	const [selectedCameraId, setSelectedCameraId] = useState<string>('');

	const getAvailableCameras = useCallback(async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices
				.filter((device) => device.kind === 'videoinput')
				.map((device) => ({
					deviceId: device.deviceId,
					label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
					groupId: device.groupId,
				}));

			setAvailableCameras(videoDevices);

			if (videoDevices.length > 0 && !selectedCameraId) {
				setSelectedCameraId(videoDevices[0].deviceId);
			}
		} catch (err) {
			console.error('Error enumerating devices:', err);
			setError('Unable to access camera devices.');
		}
	}, [selectedCameraId]);

	const startCamera = useCallback(async () => {
		if (isLoading) return;

		setIsLoading(true);
		setError(null);

		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			setStream(null);
		}

		try {
			const videoConstraints: MediaTrackConstraints = {
				width: { ideal: 640 },
				height: { ideal: 480 },
			};

			if (selectedCameraId) {
				videoConstraints.deviceId = { exact: selectedCameraId };
			}

			const constraints: MediaStreamConstraints = {
				video: videoConstraints,
			};

			const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

			setStream(mediaStream);

			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
		} catch (err) {
			console.error('Error accessing camera:', err);
			setError('Unable to access camera. Please check permissions.');
		} finally {
			setIsLoading(false);
		}
	}, [selectedCameraId, isLoading, stream]);

	const stopCamera = useCallback(() => {
		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			setStream(null);
		}
	}, [stream]);

	const capturePhoto = useCallback(() => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		if (!context) return;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		context.drawImage(video, 0, 0);

		canvas.toBlob(
			(blob) => {
				if (blob) {
					const file = new File([blob], 'captured-photo.jpg', {
						type: 'image/jpeg',
					});
					const preview = canvas.toDataURL('image/jpeg');
					onCapture(file, preview);
					stopCamera();
				}
			},
			'image/jpeg',
			0.9
		);
	}, [onCapture, stopCamera]);

	const handleCameraChange = useCallback(
		async (cameraId: string) => {
			setSelectedCameraId(cameraId);
			if (stream) {
				await startCamera();
			}
		},
		[stream, startCamera]
	);

	useEffect(() => {
		if (opened) {
			getAvailableCameras();
		}
	}, [opened, getAvailableCameras]);

	useEffect(() => {
		if (opened && availableCameras.length > 0 && selectedCameraId && !stream) {
			startCamera();
		}
		return () => {
			if (!opened) {
				stopCamera();
			}
		};
	}, [opened, availableCameras.length, selectedCameraId, startCamera, stopCamera, stream]);

	const handleClose = () => {
		stopCamera();
		onClose();
	};

	return (
		<Modal opened={opened} onClose={handleClose} title='Capture Photo' size='lg' centered>
			<Stack>
				{error && (
					<Text c='red' size='sm'>
						{error}
					</Text>
				)}

				<Box style={{ position: 'relative' }}>
					{!stream && isLoading && (
						<Box
							style={{
								width: '100%',
								height: '300px',
								backgroundColor: '#000',
								borderRadius: '8px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text c='white' size='sm'>
								Starting camera...
							</Text>
						</Box>
					)}

					{!stream && !isLoading && (
						<Box
							style={{
								width: '100%',
								height: '300px',
								backgroundColor: '#000',
								borderRadius: '8px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text c='white' size='sm'>
								Camera not available
							</Text>
						</Box>
					)}

					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						style={{
							width: '100%',
							maxHeight: '400px',
							backgroundColor: '#000',
							borderRadius: '8px',
							display: stream ? 'block' : 'none',
						}}
					/>

					<canvas ref={canvasRef} style={{ display: 'none' }} />
				</Box>

				{availableCameras.length > 1 && (
					<Select
						label='Select Camera'
						placeholder='Choose a camera'
						data={availableCameras.map((camera) => ({
							value: camera.deviceId,
							label: camera.label,
						}))}
						value={selectedCameraId}
						onChange={(value) => value && handleCameraChange(value)}
						leftSection={<IconVideo size={16} />}
						mb='md'
					/>
				)}

				<Group justify='flex-end'>
					<Button variant='light' onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={capturePhoto} disabled={!stream} leftSection={<IconCamera size={16} />}>
						Capture
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
