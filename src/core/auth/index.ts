export { auth, betterAuthServer } from '../auth';
export * from './permissions';
export {
	hasAnyPermission,
	hasOwnedStudentSession,
	hasSessionPermission,
	hasSessionRole,
	isStudentSession,
} from './sessionPermissions';
