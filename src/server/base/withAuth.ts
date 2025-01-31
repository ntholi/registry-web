'use server';

import { auth } from '@/auth';
import { UserRole } from '@/db/schema';
import { Session } from 'next-auth';
import { forbidden, unauthorized } from 'next/navigation';

type Role = UserRole | 'all';

export default async function withAuth<T>(
  fn: () => Promise<T>,
  roles: Role[] = [],
  accessCheck?: (session: Session) => Promise<boolean>
) {
  const session = await auth();
  const stack = new Error().stack;
  const callerLine = stack?.split('\n')[2] || '';
  const methodMatch = callerLine.match(/at\s+(.*?)\s+\(/);

  const method = methodMatch ? methodMatch[1] : 'unknown method';

  if (roles.includes('all')) {
    return fn();
  }

  if (!session?.user) {
    console.error('No session', method);
    return unauthorized();
  }

  if (!['admin', ...roles].includes(session.user.role as Role)) {
    console.error('Permission Error', method);
    return forbidden();
  }

  if (accessCheck && session.user.role !== 'admin') {
    const isAuthorized = await accessCheck(session);
    if (!isAuthorized) {
      console.error(
        'Custom Auth Check',
        {
          role: session.user.role,
          userId: session.user.id,
          stdNo: session.user.stdNo,
        },
        method
      );
      return forbidden();
    }
  }

  return fn();
}
