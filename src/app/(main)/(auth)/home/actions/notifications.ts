'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { registrationRequests } from '@/db/schema';
import { getCurrentTerm } from '@/server/terms/actions';
import { isAfter, subDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'registration' | 'academic' | 'finance' | 'general';
  status: 'pending' | 'approved' | 'rejected' | 'info';
  timestamp: Date;
  href: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth();
  const term = await getCurrentTerm();
  if (!session?.user?.stdNo) return [];

  const req = await db.query.registrationRequests.findFirst({
    where: and(
      eq(registrationRequests.stdNo, session.user.stdNo),
      eq(registrationRequests.termId, term.id)
    ),
    orderBy: (requests) => requests.createdAt,
  });

  if (
    req?.status === 'approved' &&
    req?.dateApproved &&
    isAfter(subDays(new Date(), 2), req.dateApproved)
  )
    return [];

  if (!req) return [];

  return [
    {
      id: req.id.toString(),
      title: 'Registration Status',
      message: `${
        req.message || statusFromRequest(req.status)
      } Click to view details`,
      type: 'registration',
      status: req.status,
      timestamp: req.createdAt ?? new Date(),
      href:
        req.status === 'approved' ? `/registration` : `/registration/status`,
    },
  ];
}

function statusFromRequest(status: 'pending' | 'approved' | 'rejected') {
  switch (status) {
    case 'pending':
      return 'Your registration request is currently under review.';
    case 'rejected':
      return 'Your registration request has been rejected';
    case 'approved':
      return 'Your registration request has been approved';
  }
}
