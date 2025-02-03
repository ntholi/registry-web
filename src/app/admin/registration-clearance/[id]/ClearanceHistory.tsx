import React from 'react';

type Props = {
  clearanceId: number;
};
export default function ClearanceHistory({ clearanceId }: Props) {
  return <div>ClearanceHistory {clearanceId}</div>;
}
