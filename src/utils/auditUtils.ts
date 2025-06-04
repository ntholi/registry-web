export function generateAssessmentMarkAuditMessage(
  action: 'create' | 'update' | 'delete',
  previousMarks?: number | null,
  newMarks?: number | null,
): string {
  switch (action) {
    case 'create':
      return `Assessment mark created with value ${newMarks}`;
    case 'update':
      return `Assessment mark updated from ${previousMarks} to ${newMarks}`;
    case 'delete':
      return `Assessment mark deleted (was ${previousMarks})`;
    default:
      return 'Assessment mark modified';
  }
}

export function formatAuditDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
