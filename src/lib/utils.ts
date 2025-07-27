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
  sem: number | undefined | null,
  type: 'full' | 'short' = 'full'
) {
  if (!sem) return '';
  const year = Math.ceil(sem / 2);
  const semester = sem % 2 === 0 ? 2 : 1;

  return type === 'full'
    ? `Year ${year} • Semester ${semester}`
    : `Y${year}S${semester}`;
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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function sanitize<T extends {}>(values: T | undefined) {
  if (!values) return undefined;

  return Object.entries(values).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: value === null ? undefined : value,
    };
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

export function formatPhoneNumber(phone: string | null | undefined) {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) return null;
  if (cleaned.startsWith('266')) {
    if (cleaned.length === 11) {
      return `(+266) ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('27')) {
    if (cleaned.length === 11) {
      return `+27 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return `+${cleaned}`;
  }

  if (
    cleaned.length === 8 &&
    (cleaned.startsWith('2') ||
      cleaned.startsWith('5') ||
      cleaned.startsWith('6'))
  ) {
    return `+266 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  if (cleaned.length >= 10) {
    const countryCode = cleaned.slice(0, -10);
    const number = cleaned.slice(-10);
    if (countryCode) {
      return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  }
  return cleaned;
}
