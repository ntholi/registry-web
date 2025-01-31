import React from 'react';
import { getClearanceRequest } from '@/server/clearance-requests/actions';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getClearanceRequest>>>;
};

export default function ClearanceSwitch({ request }: Props) {
  return <div>ClearanceSwitch</div>;
}
