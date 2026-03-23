'use client';

import { Switch } from '@mantine/core';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import type { MailTriggerType } from '../_lib/types';
import { toggleMailTrigger } from './_server/actions';

type Props = {
	triggerType: MailTriggerType;
	defaultEnabled: boolean;
};

export default function TriggerSwitch({ triggerType, defaultEnabled }: Props) {
	const [checked, setChecked] = useState(defaultEnabled);

	const { mutate, isPending } = useActionMutation(
		(enabled: boolean) => toggleMailTrigger(triggerType, enabled),
		{ onSuccess: (_, enabled) => setChecked(enabled) }
	);

	return (
		<Switch
			checked={checked}
			disabled={isPending}
			onChange={(e) => mutate(e.currentTarget.checked)}
			size='sm'
		/>
	);
}
