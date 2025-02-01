import { db } from '@/db';

import { eq } from 'drizzle-orm';

import { registrationClearances } from '@/db/schema';

export async function getRegistrationClearances(registrationRequestId: number) {
  return await db.query.registrationClearances.findMany({
    where: eq(
      registrationClearances.registrationRequestId,
      registrationRequestId
    ),
    with: {
      clearedBy: true,
    },
  });
}
