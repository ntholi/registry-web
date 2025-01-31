'use client';

import { getRegistrationRequest } from '@/server/registration-requests/actions';

type Props = {
  value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};
export default function ModulesView({ value }: Props) {
  const { requestedModules } = value;
  return (
    <div>
      {requestedModules.map((module) => (
        <div key={module.id}>{module.moduleId}</div>
      ))}
    </div>
  );
}
