'use client';

import {
	Alert,
	Autocomplete,
	Button,
	Container,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
	Title,
	useComputedColorScheme,
} from '@mantine/core';
import { IconArrowRight, IconShieldCheck } from '@tabler/icons-react';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { wordList } from '../_lib/wordList';

type Props = {
	error?: string;
};

export default function PassphraseEntry({ error }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const colorScheme = useComputedColorScheme('dark');
	const isDark = colorScheme === 'dark';

	const [words, setWords] = useState(['', '', '']);
	const [validationError, setValidationError] = useState(error || '');
	const [isPending, startTransition] = useTransition();

	const cachedPassphrase =
		typeof window !== 'undefined'
			? localStorage.getItem('feedback-passphrase')
			: null;
	const [showResume, setShowResume] = useState(false);

	useEffect(() => {
		const p = searchParams.get('passphrase');
		if (p) {
			const parts = p.split(' ');
			if (parts.length === 3) {
				setWords(parts);
			}
		} else if (cachedPassphrase) {
			setShowResume(true);
		}
	}, [searchParams, cachedPassphrase]);

	const filterWords = useCallback((value: string) => {
		if (!value) return wordList.slice(0, 20);
		const lower = value.toLowerCase();
		return wordList.filter((w) => w.startsWith(lower)).slice(0, 20);
	}, []);

	function updateWord(index: number, value: string) {
		setWords((prev) => {
			const next = [...prev];
			next[index] = value.toLowerCase().trim();
			return next;
		});
		setValidationError('');
	}

	function handleSubmit() {
		const allValid = words.every((w) => wordList.includes(w));
		if (!allValid) {
			setValidationError('Please enter valid words from the word list.');
			return;
		}
		const passphrase = words.join(' ');
		localStorage.setItem('feedback-passphrase', passphrase);
		startTransition(() => {
			router.push(`/feedback?passphrase=${encodeURIComponent(passphrase)}`);
		});
	}

	function handleResume() {
		if (!cachedPassphrase) return;
		const parts = cachedPassphrase.split(' ');
		setWords(parts);
		setShowResume(false);
		localStorage.setItem('feedback-passphrase', cachedPassphrase);
		startTransition(() => {
			router.push(
				`/feedback?passphrase=${encodeURIComponent(cachedPassphrase)}`
			);
		});
	}

	return (
		<Container size='xs' py='xl'>
			<Stack align='center' gap='lg'>
				<Image
					src={isDark ? '/images/logo-dark.png' : '/images/logo-light.png'}
					alt='Limkokwing University'
					component={NextImage}
					h={50}
					w='auto'
					width={200}
					height={50}
					style={{ objectFit: 'contain' }}
				/>
				<Stack align='center' gap={4}>
					<Title order={2} ta='center'>
						Student Feedback Portal
					</Title>
					<Text c='dimmed' ta='center' size='sm'>
						Enter your passphrase to provide anonymous feedback
					</Text>
				</Stack>

				<Alert
					icon={<IconShieldCheck size={20} />}
					color='teal'
					variant='light'
					w='100%'
				>
					Your responses are completely anonymous. We cannot trace feedback to
					individuals.
				</Alert>

				{showResume && cachedPassphrase && (
					<Alert color='blue' variant='light' w='100%'>
						<Stack gap='xs'>
							<Text size='sm'>
								You have an unfinished feedback session. Would you like to
								resume?
							</Text>
							<Group>
								<Button size='xs' variant='light' onClick={handleResume}>
									Resume
								</Button>
								<Button
									size='xs'
									variant='subtle'
									color='gray'
									onClick={() => setShowResume(false)}
								>
									Start fresh
								</Button>
							</Group>
						</Stack>
					</Alert>
				)}

				<Stack w='100%' gap='md'>
					<SimpleGrid cols={{ base: 1, sm: 3 }}>
						{words.map((word, i) => (
							<Autocomplete
								key={i}
								label={`Word ${i + 1}`}
								placeholder='Type a word...'
								value={word}
								onChange={(val) => updateWord(i, val)}
								data={filterWords(word)}
								maxDropdownHeight={200}
							/>
						))}
					</SimpleGrid>

					{validationError && (
						<Text c='red' size='sm' ta='center'>
							{validationError}
						</Text>
					)}

					<Button
						fullWidth
						size='md'
						onClick={handleSubmit}
						loading={isPending}
						rightSection={<IconArrowRight size={18} />}
					>
						Continue
					</Button>
				</Stack>
			</Stack>
		</Container>
	);
}
