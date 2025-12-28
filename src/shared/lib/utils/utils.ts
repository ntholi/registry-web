export function formatDate(
	timestamp: number | Date | undefined | null,
	type: 'long' | 'short' | 'numeric' = 'long'
) {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleDateString('en-GB', {
		year: 'numeric',
		month: type,
		day: 'numeric',
	});
}

export function formatDateTime(timestamp: number | Date | undefined | null) {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleDateString('en-GB', {
		year: 'numeric',
		month: '2-digit',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	});
}

export function formatSemester(
	sem: string | undefined | null,
	type: 'full' | 'short' | 'mini' = 'full'
) {
	if (sem === null || sem === undefined) {
		throw new Error('Semester number cannot be null or undefined');
	}

	const semStr = String(sem);
	const letterMatch = semStr.match(/^([A-Z])(\d+)$/);

	if (letterMatch) {
		const [, letter, number] = letterMatch;
		if (letter === 'F') {
			return type === 'full' ? `Foundation ${number}` : `F${number}`;
		}
		if (letter === 'B') {
			return type === 'full' ? `Bridging ${number}` : `B${number}`;
		}
		return semStr;
	}

	const semNumber = Number.parseInt(semStr, 10);
	if (Number.isNaN(semNumber)) {
		throw new Error(`Invalid semester number: ${sem}`);
	}
	const year = Math.ceil(semNumber / 2);
	const semester = semNumber % 2 === 0 ? 2 : 1;

	return type === 'full'
		? `Year ${year} • Semester ${semester}`
		: type === 'short'
			? `Year ${year} • Sem ${semester}`
			: `Y${year}S${semester}`;
}

export function compareSemesters(a: string, b: string) {
	const aStr = String(a);
	const bStr = String(b);

	const aLetterMatch = aStr.match(/^([A-Z])(\d+)$/);
	const bLetterMatch = bStr.match(/^([A-Z])(\d+)$/);

	if (aLetterMatch && bLetterMatch) {
		const [, aLetter, aNumber] = aLetterMatch;
		const [, bLetter, bNumber] = bLetterMatch;
		if (aLetter !== bLetter) {
			return aLetter.localeCompare(bLetter);
		}
		return Number(aNumber) - Number(bNumber);
	}

	if (aLetterMatch && !bLetterMatch) {
		return -1;
	}

	if (!aLetterMatch && bLetterMatch) {
		return 1;
	}

	return Number(aStr) - Number(bStr);
}

export function toTitleCase(str: string | undefined | null) {
	if (!str) return '';
	return str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Sanitizes the values of an object to ensure that null values are converted to undefined,
 * @param values - The object to sanitize
 * @returns The sanitized object
 */
export function sanitize<T extends Record<string, unknown>>(
	values: T | undefined
) {
	if (!values) return undefined;

	return Object.entries(values).reduce((acc, [key, value]) => {
		(acc as Record<string, unknown>)[key] = value === null ? undefined : value;
		return acc;
	}, {} as T);
}

export function largeProfilePic(image: string | null | undefined) {
	if (image) {
		if (image.includes('google')) {
			return image.replace('=s96-c', '');
		} else if (image.includes('facebook')) {
			return image.replace('picture', 'picture?type=large');
		}
	}
	return image;
}

export function toClassName(programCode: string, semesterName: string) {
	const year = semesterName.match(/Year (\d+)/)?.[1] || '';
	const semester = semesterName.match(/Sem (\d+)/)?.[1] || '';
	return `${programCode}Y${year}S${semester}`;
}

export function getStudentClassName(structureSemester: {
	semesterNumber: string;
	structure: { program: { code: string } };
}) {
	const code = structureSemester.structure.program.code;
	const num = structureSemester.semesterNumber;
	return `${code}${formatSemester(num, 'mini')}`;
}

export function formatPhoneNumber(phone: string | null | undefined) {
	if (!phone) return null;

	const cleaned = phone.replace(/\D/g, '');

	if (cleaned.length === 0) return null;

	if (cleaned.startsWith('266')) {
		if (cleaned.length === 11) {
			return `(+266) ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
		}
		return `(+266) ${cleaned.slice(3)}`;
	}

	if (cleaned.startsWith('27')) {
		if (cleaned.length === 11) {
			return `(+27) ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
		}
		return `(+27) ${cleaned.slice(2)}`;
	}

	if (
		cleaned.length === 8 &&
		(cleaned.startsWith('2') ||
			cleaned.startsWith('5') ||
			cleaned.startsWith('6'))
	) {
		return `(+266) ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
	}

	if (cleaned.length >= 10) {
		const countryCode = cleaned.slice(0, -10);
		const number = cleaned.slice(-10);
		if (countryCode) {
			return `(+${countryCode}) ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
		}
		return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
	}

	return `(+266) ${cleaned}`;
}

export const convertUrlToBase64 = async (url: string): Promise<string> => {
	try {
		const response = await fetch('/api/convert-image', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (data.error) {
			throw new Error(data.error);
		}

		return data.dataUrl;
	} catch (error) {
		console.error('Error converting URL to base64:', error);
		throw error;
	}
};

export function truncateText(text: string, maxLength: number = 50) {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength - 3)}...`;
}

export function calculateAge(
	birthDate: Date | number | string | null | undefined
) {
	if (!birthDate) return null;
	const birth = new Date(birthDate);
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

export function formatTerm(
	term: string | undefined | null,
	type: 'long' | 'short' = 'short'
) {
	if (!term) return '';

	const [year, month] = term.split('-');
	if (!year || !month) return term;

	const monthNum = Number.parseInt(month, 10);
	if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) return term;

	const date = new Date(Number.parseInt(year, 10), monthNum - 1);
	const monthName = date.toLocaleDateString('en-US', {
		month: type === 'long' ? 'long' : 'short',
	});

	return `${monthName} ${year}`;
}
