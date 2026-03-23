'use server';

import { db } from '@/core/database';
import { withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { MailTriggerType } from '../../_lib/types';
import { mailTriggerSettings } from '../../_schema/mailTriggerSettings';
import { getTriggerSettings } from './repository';

export async function getMailTriggerSettings() {
	return withPermission(() => getTriggerSettings(), { mails: ['read'] });
}

export const toggleMailTrigger = createAction(
	async (triggerType: MailTriggerType, enabled: boolean) =>
		withPermission(
			async () => {
				await db
					.insert(mailTriggerSettings)
					.values({ triggerType, enabled })
					.onConflictDoUpdate({
						target: mailTriggerSettings.triggerType,
						set: { enabled },
					});
				return { triggerType, enabled };
			},
			{ mails: ['update'] }
		)
);
