'use client';
import { Anchor, type AnchorProps } from '@mantine/core';
import NextLink, { type LinkProps } from 'next/link';

type Props = AnchorProps &
	LinkProps & {
		children: React.ReactNode;
		target?: '_self' | '_blank' | '_parent' | '_top';
	};

export default function Link(props: Props) {
	return <Anchor component={NextLink} {...props} />;
}
