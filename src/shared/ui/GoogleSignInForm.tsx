'use client';

import { Button, type ButtonProps } from '@mantine/core';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { authClient } from '@/core/auth-client';

interface Props {
	redirectTo?: string;
	children?: ReactNode;
	leftSection?: ReactNode;
	rightSection?: ReactNode;
	variant?: ButtonProps['variant'];
}

export default function GoogleSignInForm({
	redirectTo = '/',
	children,
	leftSection,
	rightSection,
	variant = 'default',
}: Props) {
	function handleSignIn() {
		void authClient.signIn.social({
			provider: 'google',
			callbackURL: redirectTo,
		});
	}

	return (
		<Button
			onClick={handleSignIn}
			variant={variant}
			leftSection={
				leftSection === undefined ? (
					<Image src='/images/google.svg' alt='Google' width={18} height={18} />
				) : (
					leftSection
				)
			}
			rightSection={rightSection}
			fullWidth
		>
			{children ?? 'Sign in with Google'}
		</Button>
	);
}
