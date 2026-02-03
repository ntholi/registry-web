'use server';

import { Button } from '@mantine/core';
import Image from 'next/image';
import { signIn } from '@/core/auth';

interface Props {
	redirectTo?: string;
}

export default async function GoogleSignInForm({ redirectTo = '/' }: Props) {
	async function handleSignIn() {
		'use server';
		await signIn('google', { redirectTo });
	}

	return (
		<form action={handleSignIn}>
			<Button
				type='submit'
				variant='default'
				leftSection={
					<Image src='/images/google.svg' alt='Google' width={18} height={18} />
				}
				fullWidth
			>
				Sign in with Google
			</Button>
		</form>
	);
}
