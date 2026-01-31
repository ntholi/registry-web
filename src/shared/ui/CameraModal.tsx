'use client';

import { Box, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import imageCompression from 'browser-image-compression';
import { useRef, useState } from 'react';

type AnalyzingState = {
	isAnalyzing: boolean;
	previewUrl: string | null;
	stage: 'compressing' | 'analyzing';
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
	const [state, setState] = useState<AnalyzingState>({
		isAnalyzing: false,
		previewUrl: null,
		stage: 'compressing',
	});

	function openCamera() {
		if (disabled) return;
		inputRef.current?.click();
	}

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		event.target.value = '';

		const previewUrl = URL.createObjectURL(file);
		setState({ isAnalyzing: true, previewUrl, stage: 'compressing' });

		const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
		const renamedFile = new File(
			[compressedFile],
			`capture-${Date.now()}.jpg`,
			{
				type: 'image/jpeg',
			}
		);

		setState((prev) => ({ ...prev, stage: 'analyzing' }));

		await onCapture(renamedFile);

		URL.revokeObjectURL(previewUrl);
		setState({ isAnalyzing: false, previewUrl: null, stage: 'compressing' });
	}

	function handleClose() {
		if (state.previewUrl) {
			URL.revokeObjectURL(state.previewUrl);
		}
		setState({ isAnalyzing: false, previewUrl: null, stage: 'compressing' });
	}

	const stageMessage =
		state.stage === 'compressing'
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
				style={{ display: 'none' }}
			/>
			{children({ openCamera, isProcessing: state.isAnalyzing })}
			<Modal
				opened={state.isAnalyzing}
				onClose={handleClose}
				title='Analyzing Document'
				fullScreen
				closeOnClickOutside={false}
				closeOnEscape={false}
				withCloseButton={false}
				styles={{
					body: { padding: 0, height: 'calc(100vh - 60px)' },
					content: { display: 'flex', flexDirection: 'column' },
				}}
			>
				<Stack gap={0} h='100%'>
					{state.previewUrl && (
						<>
							<Box pos='relative' flex={1} style={{ overflow: 'hidden' }}>
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
							</Box>
							<Group
								justify='center'
								p='lg'
								bg='dark.7'
								style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
							>
								<Stack gap='xs' align='center'>
									<Loader type='dots' color='cyan' size='md' />
									<Text size='sm' fw={500}>
										{stageMessage}
									</Text>
								</Stack>
							</Group>
							<style>{`
								@keyframes scanLine {
									0%, 100% { top: 0%; }
									50% { top: calc(100% - 2px); }
								}
							`}</style>
						</>
					)}
				</Stack>
			</Modal>
		</>
	);
}
