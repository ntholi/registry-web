import { redirect } from 'next/navigation';

export default function MailPage() {
	redirect('/admin/mail/inbox');
}
