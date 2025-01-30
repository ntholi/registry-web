import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number | Date) {
  return new Date(timestamp).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatSemester(sem: number) {
  const year = Math.ceil(sem / 2);
  const semester = sem % 2 === 0 ? 2 : 1;

  return `Year ${year} • Semester ${semester}`;
}
