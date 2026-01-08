export function parseDate(date: string | Date | null | undefined): Date | null {
	if (!date) return null;
	const d = new Date(date);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(
	timestamp: number | Date | string | undefined | null,
	type: 'long' | 'short' | 'numeric' = 'long'
) {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleDateString('en-GB', {
		year: 'numeric',
		month: type,
		day: 'numeric',
	});
}

export function formatTime(
	timestamp: number | Date | string | undefined | null,
	includeSeconds = false
) {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		second: includeSeconds ? '2-digit' : undefined,
		hour12: false,
	});
}

export function formatDateTime(
	timestamp: number | Date | string | undefined | null
) {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleString('en-GB', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function formatMoodleDate(
	unixTimestamp: number | null | undefined,
	includeTime = true
) {
	if (!unixTimestamp) return 'N/A';
	const date = new Date(unixTimestamp * 1000);
	if (includeTime) {
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export function formatDateToISO(date: Date | string | null | undefined) {
	if (!date) return '';
	if (typeof date === 'string') return date;
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatMonthYear(
	date: Date | string | null | undefined,
	type: 'long' | 'short' = 'long'
) {
	if (!date) return '';
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', {
		month: type,
		year: 'numeric',
	});
}

export function formatIssueDate(date: Date | string | null | undefined) {
	if (!date) return '';
	return new Date(date).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
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

export function formatRelativeTime(
	date: Date | null | string | number | undefined
) {
	if (!date) return '';
	const now = new Date();
	const d = new Date(date);
	const diff = now.getTime() - d.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return d.toLocaleDateString('en-GB', { dateStyle: 'short' });
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
