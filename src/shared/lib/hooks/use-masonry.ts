import { useEffect, useRef, useState } from 'react';

export interface MasonryItemProps {
	colSpan?: number;
	rowSpan?: number;
}

export interface MasonryConfig {
	columns: number;
	gap: number;
	breakpoints?: {
		xs?: number;
		sm?: number;
		md?: number;
		lg?: number;
	};
}

const defaultBreakpoints = {
	xs: 576,
	sm: 768,
	md: 992,
	lg: 1200,
};

export function useMasonryLayout(
	config: MasonryConfig | number,
	gap?: number,
	breakpoint?: number
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLayoutReady, setIsLayoutReady] = useState(false);
	const [currentColumns, setCurrentColumns] = useState(1);

	const normalizedConfig: MasonryConfig =
		typeof config === 'number'
			? {
					columns: config,
					gap: gap ?? 16,
					breakpoints: breakpoint ? { sm: breakpoint } : undefined,
				}
			: config;

	const { columns, gap: gridGap, breakpoints } = normalizedConfig;
	const bp = { ...defaultBreakpoints, ...breakpoints };

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			if (width < bp.xs) {
				setCurrentColumns(1);
			} else if (width < bp.sm) {
				setCurrentColumns(Math.min(columns, 1));
			} else if (width < bp.md) {
				setCurrentColumns(Math.min(columns, 2));
			} else {
				setCurrentColumns(columns);
			}
		};

		updateColumns();
		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, [columns, bp.xs, bp.sm, bp.md]);

	useEffect(() => {
		setIsLayoutReady(true);
	}, []);

	const containerStyle: React.CSSProperties = {
		display: 'grid',
		gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
		gap: `${gridGap}px`,
		width: '100%',
	};

	const getItemStyle = (props?: MasonryItemProps): React.CSSProperties => {
		const colSpan = Math.min(props?.colSpan ?? 1, currentColumns);
		return {
			gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
			gridRow: props?.rowSpan ? `span ${props.rowSpan}` : undefined,
		};
	};

	return {
		containerRef,
		isLayoutReady,
		containerStyle,
		getItemStyle,
		currentColumns,
	};
}
