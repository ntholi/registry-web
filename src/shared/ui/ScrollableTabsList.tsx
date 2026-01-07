'use client';

import {
	ActionIcon,
	Box,
	Group,
	TabsList,
	type TabsListProps,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import {
	Children,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

interface ScrollableTabsListProps extends Omit<TabsListProps, 'children'> {
	children: ReactNode;
	actions?: ReactNode;
	scrollThreshold?: number;
}

export default function ScrollableTabsList({
	children,
	actions,
	scrollThreshold = 6,
	...props
}: ScrollableTabsListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const { ref: containerRef, width: containerWidth } = useElementSize();
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const tabCount = Children.toArray(children).filter(Boolean).length;
	const shouldScroll = tabCount >= scrollThreshold;

	const checkScrollPosition = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;

		const hasOverflow = el.scrollWidth > el.clientWidth;
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(
			hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
		);
	}, []);

	useEffect(() => {
		checkScrollPosition();
	}, [checkScrollPosition]);

	useEffect(() => {
		if (containerWidth > 0) {
			checkScrollPosition();
		}
	}, [containerWidth, checkScrollPosition]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		el.addEventListener('scroll', checkScrollPosition);
		return () => el.removeEventListener('scroll', checkScrollPosition);
	}, [checkScrollPosition]);

	const scroll = (direction: 'left' | 'right') => {
		const el = scrollRef.current;
		if (!el) return;

		const scrollAmount = el.clientWidth * 0.6;
		el.scrollBy({
			left: direction === 'left' ? -scrollAmount : scrollAmount,
			behavior: 'smooth',
		});
	};

	if (!shouldScroll) {
		return (
			<TabsList {...props}>
				{children}
				{actions && <Box ml='auto'>{actions}</Box>}
			</TabsList>
		);
	}

	return (
		<Group ref={containerRef} gap='xs' wrap='nowrap'>
			<ActionIcon
				variant='default'
				size='lg'
				radius={'xl'}
				onClick={() => scroll('left')}
				aria-label='Scroll tabs left'
				disabled={!canScrollLeft}
				style={{ flexShrink: 0 }}
			>
				<IconChevronLeft size={16} />
			</ActionIcon>

			<TabsList
				ref={scrollRef}
				{...props}
				style={{
					flex: 1,
					flexWrap: 'nowrap',
					overflowX: 'auto',
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
					...props.style,
				}}
			>
				{children}
			</TabsList>

			<ActionIcon
				variant='default'
				size='lg'
				radius={'xl'}
				onClick={() => scroll('right')}
				aria-label='Scroll tabs right'
				disabled={!canScrollRight}
				style={{ flexShrink: 0 }}
			>
				<IconChevronRight size={16} />
			</ActionIcon>

			{actions && (
				<Box
					ml='auto'
					pl='md'
					style={{
						flexShrink: 0,
						borderBottom:
							'var(--tab-border-width) solid var(--_tab-border-color)',
					}}
				>
					{actions}
				</Box>
			)}
		</Group>
	);
}
