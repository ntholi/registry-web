'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconCamera, IconRefresh, IconX } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

type Props = {
	opened: boolean;
	onClose: () => void;
	onCapture: (file: File) => void;
};

export function CameraModal({ opened, onClose, onCapture }: Props) {
	const webcamRef = useRef<Webcam>(null);
	const [error, setError] = useState<string | null>(null);
	const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
	const [retryCount, setRetryCount] = useState(0);

	const videoConstraints = {
		facingMode: facingMode,
		width: { ideal: 1920 },
		height: { ideal: 1080 },
	};

	const handleCapture = useCallback(() => {
		if (!webcamRef.current) return;

		const imageSrc = webcamRef.current.getScreenshot();
		if (!imageSrc) return;

		const byteString = atob(imageSrc.split(',')[1]);
		const mimeType = imageSrc.split(',')[0].split(':')[1].split(';')[0];
		const arrayBuffer = new ArrayBuffer(byteString.length);
		const uint8Array = new Uint8Array(arrayBuffer);
		for (let i = 0; i < byteString.length; i++) {
			uint8Array[i] = byteString.charCodeAt(i);
		}
		const blob = new Blob([uint8Array], { type: mimeType });
		const file = new File([blob], `capture-${Date.now()}.jpg`, {
			type: 'image/jpeg',
		});

		onCapture(file);
		onClose();
	}, [onCapture, onClose]);

	function handleUserMediaError() {
		if (retryCount === 0) {
			setRetryCount(1);
			setFacingMode('user');
		} else {
			setError('Camera access denied. Please allow camera permissions.');
		}
	}

	function handleSwitchCamera() {
		setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
	}

	function handleClose() {
		setError(null);
		setFacingMode('user');
		setRetryCount(0);
		onClose();
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Take Photo'
			fullScreen
			styles={{
				body: { padding: 0, height: 'calc(100vh - 60px)' },
				content: { display: 'flex', flexDirection: 'column' },
			}}
		>
			<Stack gap={0} h='100%'>
				{error ? (
					<Stack align='center' justify='center' flex={1} p='xl'>
						<Text c='red' ta='center'>
							{error}
						</Text>
						<Button variant='light' onClick={handleClose}>
							Close
						</Button>
					</Stack>
				) : (
					<>
						<Webcam
							key={`${facingMode}-${retryCount}`}
							ref={webcamRef}
							audio={false}
							screenshotFormat='image/jpeg'
							screenshotQuality={0.92}
							videoConstraints={videoConstraints}
							onUserMediaError={handleUserMediaError}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								flex: 1,
							}}
						/>
						<Group
							justify='space-between'
							p='md'
							bg='dark.7'
							style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
						>
							<Button
								variant='subtle'
								color='gray'
								size='lg'
								onClick={handleClose}
								leftSection={<IconX size={20} />}
							>
								Cancel
							</Button>
							<Button
								size='xl'
								radius='xl'
								color='white'
								variant='filled'
								onClick={handleCapture}
								style={{ width: 70, height: 70, padding: 0 }}
							>
								<IconCamera size={32} />
							</Button>
							<Button
								variant='subtle'
								color='gray'
								size='lg'
								onClick={handleSwitchCamera}
								leftSection={<IconRefresh size={20} />}
							>
								Flip
							</Button>
						</Group>
					</>
				)}
			</Stack>
		</Modal>
	);
}
