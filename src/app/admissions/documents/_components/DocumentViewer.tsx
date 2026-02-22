'use client';

import { ActionIcon, Box, Group, Paper, Text, Tooltip } from '@mantine/core';
import {
	IconMinus,
	IconPlus,
	IconRotate,
	IconRotateClockwise,
} from '@tabler/icons-react';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

type Props = {
	src: string;
	alt?: string;
	initialRotation?: number;
	onRotationChange?: (rotation: number) => void;
};

export default function DocumentViewer({
	src,
	alt = 'Document',
	initialRotation = 0,
	onRotationChange,
}: Props) {
	const [scale, setScale] = useState(1);
	const [rotation, setRotation] = useState(initialRotation);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [dragging, setDragging] = useState(false);
	const dragStart = useRef({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.25, 5)), []);

	const zoomOut = useCallback(
		() => setScale((s) => Math.max(s - 0.25, 0.25)),
		[]
	);

	const rotateRight = useCallback(() => {
		setRotation((r) => {
			const next = (r + 90) % 360;
			onRotationChange?.(next);
			return next;
		});
	}, [onRotationChange]);

	const rotateLeft = useCallback(() => {
		setRotation((r) => {
			const next = (r - 90 + 360) % 360;
			onRotationChange?.(next);
			return next;
		});
	}, [onRotationChange]);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			if (e.deltaY < 0) zoomIn();
			else zoomOut();
		},
		[zoomIn, zoomOut]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (scale <= 1) return;
			setDragging(true);
			dragStart.current = {
				x: e.clientX - position.x,
				y: e.clientY - position.y,
			};
		},
		[scale, position]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!dragging) return;
			setPosition({
				x: e.clientX - dragStart.current.x,
				y: e.clientY - dragStart.current.y,
			});
		},
		[dragging]
	);

	const handleMouseUp = useCallback(() => setDragging(false), []);

	const zoomPercent = Math.round(scale * 100);

	return (
		<Paper
			radius='md'
			withBorder
			style={{
				overflow: 'hidden',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<Group
				justify='space-between'
				px='sm'
				py='xs'
				style={(theme) => ({
					borderBottom: `1px solid ${theme.colors.dark[4]}`,
					background: 'var(--mantine-color-body)',
				})}
			>
				<Group gap='xs'>
					<Tooltip label='Zoom out'>
						<ActionIcon
							variant='subtle'
							size='sm'
							onClick={zoomOut}
							disabled={scale <= 0.25}
						>
							<IconMinus size={14} />
						</ActionIcon>
					</Tooltip>
					<Text size='xs' fw={500} w={40} ta='center'>
						{zoomPercent}%
					</Text>
					<Tooltip label='Zoom in'>
						<ActionIcon
							variant='subtle'
							size='sm'
							onClick={zoomIn}
							disabled={scale >= 5}
						>
							<IconPlus size={14} />
						</ActionIcon>
					</Tooltip>
				</Group>
				<Group gap='xs'>
					<Tooltip label='Rotate left'>
						<ActionIcon variant='subtle' size='sm' onClick={rotateLeft}>
							<IconRotate size={14} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label='Rotate right'>
						<ActionIcon variant='subtle' size='sm' onClick={rotateRight}>
							<IconRotateClockwise size={14} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>
			<Box
				ref={containerRef}
				onWheel={handleWheel}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					flex: 1,
					overflow: 'hidden',
					cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: 500,
					background: 'var(--mantine-color-dark-8)',
					position: 'relative',
				}}
			>
				<Image
					src={src}
					alt={alt}
					fill
					unoptimized
					draggable={false}
					style={{
						maxWidth: '100%',
						maxHeight: '100%',
						objectFit: 'contain',
						transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
						transition: dragging ? 'none' : 'transform 0.2s ease',
						userSelect: 'none',
					}}
				/>
			</Box>
		</Paper>
	);
}
