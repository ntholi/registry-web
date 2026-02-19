'use client';

import {
	Alert,
	Badge,
	Button,
	Combobox,
	Container,
	Group,
	Image,
	Stack,
	Text,
	TextInput,
	Title,
	useCombobox,
	useComputedColorScheme,
} from '@mantine/core';
import { IconArrowRight, IconShieldCheck } from '@tabler/icons-react';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { wordList } from '../_lib/wordList';

const MAX_WORDS = 3;

type Props = {
	error?: string;
};

export default function PassphraseEntry({ error }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const colorScheme = useComputedColorScheme('dark');
	const isDark = colorScheme === 'dark';
	const inputRef = useRef<HTMLInputElement>(null);

	const [value, setValue] = useState('');
	const [validationError, setValidationError] = useState(error || '');
	const [isPending, startTransition] = useTransition();

	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	});

	const cachedPassphrase =
		typeof window !== 'undefined'
			? localStorage.getItem('feedback-passphrase')
			: null;
	const [showResume, setShowResume] = useState(false);

	useEffect(() => {
		const p = searchParams.get('passphrase');
		if (p) {
			setValue(p);
		} else if (cachedPassphrase) {
			setShowResume(true);
		}
	}, [searchParams, cachedPassphrase]);

	const parts = value.split(/\s+/).filter(Boolean);
	const currentWord = value.endsWith(' ') ? '' : (parts.at(-1) ?? '');
	const validCount = parts.filter((w) => wordList.includes(w)).length;

	const suggestions =
		currentWord.length > 0 && parts.length <= MAX_WORDS
			? wordList
					.filter((w) => w.startsWith(currentWord.toLowerCase()))
					.slice(0, 8)
			: [];

	function selectWord(word: string) {
		const updated = [...parts];
		if (value.endsWith(' ') || updated.length === 0) {
			updated.push(word);
		} else {
			updated[updated.length - 1] = word;
		}
		const next =
			updated.length < MAX_WORDS ? `${updated.join(' ')} ` : updated.join(' ');
		setValue(next);
		setValidationError('');
		combobox.closeDropdown();
		inputRef.current?.focus();
	}

	function handleChange(val: string) {
		const typed = val.split(/\s+/).filter(Boolean);
		if (typed.length > MAX_WORDS) return;
		if (typed.length === MAX_WORDS && val.endsWith(' ')) return;
		setValue(val.toLowerCase());
		setValidationError('');
		if (val && !val.endsWith(' ')) {
			combobox.openDropdown();
			combobox.resetSelectedOption();
		} else {
			combobox.closeDropdown();
		}
	}

	function handleSubmit() {
		const trimmed = value.trim().split(/\s+/).filter(Boolean);
		if (trimmed.length !== MAX_WORDS) {
			setValidationError(`Please enter exactly ${MAX_WORDS} words.`);
			return;
		}
		const allValid = trimmed.every((w) => wordList.includes(w));
		if (!allValid) {
			setValidationError('Please enter valid words from the word list.');
			return;
		}
		const passphrase = trimmed.join(' ');
		localStorage.setItem('feedback-passphrase', passphrase);
		startTransition(() => {
			router.push(`/feedback?passphrase=${encodeURIComponent(passphrase)}`);
		});
	}

	function handleResume() {
		if (!cachedPassphrase) return;
		setValue(cachedPassphrase);
		setShowResume(false);
		localStorage.setItem('feedback-passphrase', cachedPassphrase);
		startTransition(() => {
			router.push(
				`/feedback?passphrase=${encodeURIComponent(cachedPassphrase)}`
			);
		});
	}

	const options = suggestions.map((word) => (
		<Combobox.Option value={word} key={word}>
			{word}
		</Combobox.Option>
	));

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
					<Combobox
						store={combobox}
						onOptionSubmit={selectWord}
						withinPortal={false}
					>
						<Combobox.Target>
							<TextInput
								ref={inputRef}
								label='Passphrase'
								description={`Enter ${MAX_WORDS} words separated by spaces`}
								placeholder='word1 word2 word3'
								value={value}
								onChange={(e) => handleChange(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !combobox.dropdownOpened) {
										handleSubmit();
									}
								}}
								onFocus={() => {
									if (currentWord) combobox.openDropdown();
								}}
								onBlur={() => combobox.closeDropdown()}
								size='lg'
								error={validationError || undefined}
								rightSection={
									<Badge size='sm' variant='light' circle>
										{validCount}
									</Badge>
								}
								rightSectionWidth={42}
							/>
						</Combobox.Target>
						<Combobox.Dropdown>
							<Combobox.Options>
								{options.length > 0 ? (
									options
								) : (
									<Combobox.Empty>No matches</Combobox.Empty>
								)}
							</Combobox.Options>
						</Combobox.Dropdown>
					</Combobox>

					<Button
						fullWidth
						size='md'
						onClick={handleSubmit}
						loading={isPending}
						disabled={validCount < MAX_WORDS}
						rightSection={<IconArrowRight size={18} />}
					>
						Continue
					</Button>
				</Stack>
			</Stack>
		</Container>
	);
}
