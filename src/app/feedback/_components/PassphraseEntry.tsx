'use client';

import {
	Alert,
	Button,
	Combobox,
	Container,
	Group,
	Image,
	Input,
	Pill,
	PillsInput,
	Stack,
	Text,
	Title,
	useCombobox,
	useComputedColorScheme,
} from '@mantine/core';
import { IconArrowRight, IconShieldCheck } from '@tabler/icons-react';
import NextImage from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { wordList } from '../_lib/wordList';

const MAX_WORDS = 3;
const MIN_CHARS = 3;

type Props = {
	error?: string;
};

export default function PassphraseEntry({ error }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const colorScheme = useComputedColorScheme('dark');
	const isDark = colorScheme === 'dark';

	const [words, setWords] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [validationError, setValidationError] = useState('');
	const [serverError, setServerError] = useState(error || '');
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
			const parts = p.split(' ').filter(Boolean);
			if (parts.length === MAX_WORDS) {
				setWords(parts);
			}
			if (error) {
				localStorage.removeItem('feedback-passphrase');
			}
		} else if (cachedPassphrase) {
			setShowResume(true);
		}
	}, [searchParams, cachedPassphrase, error]);

	const suggestions =
		search.length >= MIN_CHARS && words.length < MAX_WORDS
			? wordList.filter((w) => w.startsWith(search.toLowerCase())).slice(0, 8)
			: [];

	function handleSelect(word: string) {
		setWords((prev) => [...prev, word]);
		setSearch('');
		setValidationError('');
		setServerError('');
		combobox.closeDropdown();
	}

	function handleRemove(word: string) {
		setWords((prev) => prev.filter((w) => w !== word));
		setValidationError('');
		setServerError('');
	}

	function handleSearchChange(val: string) {
		const cleaned = val.toLowerCase().replace(/\s/g, '');
		setSearch(cleaned);
		setValidationError('');
		if (cleaned.length >= MIN_CHARS && words.length < MAX_WORDS) {
			combobox.openDropdown();
			combobox.resetSelectedOption();
		} else {
			combobox.closeDropdown();
		}
	}

	function handleSubmit() {
		if (words.length !== MAX_WORDS) {
			setValidationError(`Please enter exactly ${MAX_WORDS} words.`);
			return;
		}
		const allValid = words.every((w) => wordList.includes(w));
		if (!allValid) {
			setValidationError('One or more words are not in the word list.');
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
		const parts = cachedPassphrase.split(' ').filter(Boolean);
		setWords(parts);
		setShowResume(false);
		localStorage.setItem('feedback-passphrase', cachedPassphrase);
		startTransition(() => {
			router.push(
				`/feedback?passphrase=${encodeURIComponent(cachedPassphrase)}`
			);
		});
	}

	const pills = words.map((word) => (
		<Pill key={word} withRemoveButton onRemove={() => handleRemove(word)}>
			{word}
		</Pill>
	));

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
					<Input.Wrapper
						label='Passphrase'
						description={`Enter ${MAX_WORDS} words (${words.length}/${MAX_WORDS})`}
					>
						<Combobox
							store={combobox}
							onOptionSubmit={handleSelect}
							withinPortal={false}
						>
							<Combobox.DropdownTarget>
								<PillsInput
									onClick={() => {
										if (search.length >= MIN_CHARS) combobox.openDropdown();
									}}
									size='lg'
									error={!!(validationError || serverError)}
								>
									<Pill.Group>
										{pills}
										{words.length < MAX_WORDS && (
											<Combobox.EventsTarget>
												<PillsInput.Field
													value={search}
													placeholder={
														words.length === 0
															? 'Start typing a word...'
															: `Word ${words.length + 1}...`
													}
													onChange={(e) =>
														handleSearchChange(e.currentTarget.value)
													}
													onFocus={() => {
														if (search.length >= MIN_CHARS)
															combobox.openDropdown();
													}}
													onBlur={() => combobox.closeDropdown()}
													onKeyDown={(e) => {
														if (
															e.key === 'Backspace' &&
															search.length === 0 &&
															words.length > 0
														) {
															e.preventDefault();
															setWords((prev) => prev.slice(0, -1));
														}
														if (
															(e.key === 'Enter' || e.key === ' ') &&
															suggestions.length === 1
														) {
															e.preventDefault();
															handleSelect(suggestions[0]);
															return;
														}
														if (
															e.key === 'Enter' &&
															!combobox.dropdownOpened &&
															words.length === MAX_WORDS
														) {
															handleSubmit();
														}
													}}
												/>
											</Combobox.EventsTarget>
										)}
									</Pill.Group>
								</PillsInput>
							</Combobox.DropdownTarget>
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
					</Input.Wrapper>

					{(validationError || serverError) && (
						<Text c='red' size='sm'>
							{validationError || serverError}
						</Text>
					)}

					<Button
						fullWidth
						size='md'
						onClick={handleSubmit}
						loading={isPending}
						disabled={words.length < MAX_WORDS}
						rightSection={<IconArrowRight size={18} />}
					>
						Continue
					</Button>
				</Stack>
			</Stack>
		</Container>
	);
}
