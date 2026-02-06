'use client';

import { Box, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import imageCompression from 'browser-image-compression';
import { useRef, useState } from 'react';

type CaptureState = {
	phase: 'idle' | 'camera-open' | 'compressing' | 'analyzing';
	previewUrl: string | null;
};

type Props = {
	onCapture: (file: File) => Promise<void>;
	disabled?: boolean;
	children: (props: {
		openCamera: () => void;
		isProcessing: boolean;
	}) => React.ReactNode;
};

const COMPRESSION_OPTIONS = {
	maxSizeMB: 1,
	maxWidthOrHeight: 1920,
	useWebWorker: true,
	fileType: 'image/jpeg' as const,
};

export function CameraCapture({ onCapture, disabled, children }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [state, setState] = useState<CaptureState>({
		phase: 'idle',
		previewUrl: null,
	});

	function openCamera() {
		if (disabled) return;
		setState({ phase: 'camera-open', previewUrl: null });
		inputRef.current?.click();
	}

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files || files.length === 0) {
			setState({ phase: 'idle', previewUrl: null });
			return;
		}

		const file = files[0];
		event.target.value = '';

		const previewUrl = URL.createObjectURL(file);
		setState({ phase: 'compressing', previewUrl });

		const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
		const renamedFile = new File(
			[compressedFile],
			`capture-${Date.now()}.jpg`,
			{
				type: 'image/jpeg',
			}
		);

		setState((prev) => ({ ...prev, phase: 'analyzing' }));

		await onCapture(renamedFile);

		URL.revokeObjectURL(previewUrl);
		setState({ phase: 'idle', previewUrl: null });
	}

	function handleClose() {
		if (state.previewUrl) {
			URL.revokeObjectURL(state.previewUrl);
		}
		setState({ phase: 'idle', previewUrl: null });
	}

	function handleInputBlur() {
		setTimeout(() => {
			if (state.phase === 'camera-open') {
				setState({ phase: 'idle', previewUrl: null });
			}
		}, 300);
	}

	const isOpen = state.phase !== 'idle';
	const stageMessage =
		state.phase === 'camera-open'
			? 'Opening camera...'
			: state.phase === 'compressing'
				? 'Compressing image...'
				: 'Analyzing document...';

	return (
		<>
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				capture='environment'
				onChange={handleFileChange}
				onBlur={handleInputBlur}
				style={{ display: 'none' }}
			/>
			{children({ openCamera, isProcessing: isOpen })}
			<Modal
				opened={isOpen}
				onClose={handleClose}
				fullScreen
				closeOnClickOutside={false}
				closeOnEscape={false}
				withCloseButton={false}
				transitionProps={{ duration: 0 }}
				styles={{
					body: { padding: 0, height: 'calc(100vh - 60px)' },
					content: { display: 'flex', flexDirection: 'column' },
				}}
			>
				<Stack gap={0} h='100%'>
					<Box pos='relative' flex={1} style={{ overflow: 'hidden' }}>
						{state.previewUrl ? (
							<>
								<Box
									component='img'
									src={state.previewUrl}
									alt='Captured document'
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
									}}
								/>
								<Box
									pos='absolute'
									left={0}
									right={0}
									h={2}
									style={{
										background:
											'linear-gradient(90deg, transparent 0%, var(--mantine-color-blue-5) 20%, var(--mantine-color-cyan-4) 50%, var(--mantine-color-blue-5) 80%, transparent 100%)',
										boxShadow: '0 0 12px 2px var(--mantine-color-blue-5)',
										animation: 'scanLine 2s ease-in-out infinite',
									}}
								/>
							</>
						) : (
							<Box
								h='100%'
								bg='dark.8'
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							/>
						)}
					</Box>
					<style>{`
						@keyframes scanLine {
							0%, 100% { top: 0%; }
							50% { top: calc(100% - 2px); }
						}
					`}</style>
				</Stack>
				<Group
					justify='center'
					p='lg'
					style={{
						background: 'rgba(36, 36, 36, 0.8)',
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
					}}
				>
					<Stack gap='xs' align='center'>
						{state.phase !== 'camera-open' && (
							<Loader type='dots' color='cyan' size='md' />
						)}
						<Text size='xs'>{stageMessage}</Text>
					</Stack>
				</Group>
			</Modal>
		</>
	);
}
