'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'list-layout-panel-width';
const DEFAULT_WIDTH_PERCENT = 28.57;

export function useResizablePanel() {
	const [widthPercent, setWidthPercent] = useState(DEFAULT_WIDTH_PERCENT);
	const isDragging = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const hydrated = useRef(false);

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			setWidthPercent(Number.parseFloat(stored));
		}
		hydrated.current = true;
	}, []);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		isDragging.current = true;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}, []);

	useEffect(() => {
		function handleMouseMove(e: MouseEvent) {
			if (!isDragging.current || !containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const percent = (x / rect.width) * 100;
			setWidthPercent(percent);
		}

		function handleMouseUp() {
			if (!isDragging.current) return;
			isDragging.current = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		}

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, []);

	useEffect(() => {
		if (hydrated.current) {
			localStorage.setItem(STORAGE_KEY, String(widthPercent));
		}
	}, [widthPercent]);

	return { widthPercent, containerRef, handleMouseDown };
}
