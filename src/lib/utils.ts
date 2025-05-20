import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number | Date | undefined | null) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
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

export function formatSemester(sem: number | undefined | null) {
  if (!sem) return '';
  const year = Math.ceil(sem / 2);
  const semester = sem % 2 === 0 ? 2 : 1;

  return `Year ${year} • Semester ${semester}`;
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
