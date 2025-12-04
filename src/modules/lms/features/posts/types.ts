export type PostType = 'announcement' | 'discussion';

export type MoodleForum = {
	id: number;
	course: number;
	type: string;
	name: string;
	intro: string;
	introformat: number;
	assessed: number;
	assesstimestart: number;
	assesstimefinish: number;
	scale: number;
	maxbytes: number;
	maxattachments: number;
	forcesubscribe: number;
	trackingtype: number;
	rsstype: number;
	rssarticles: number;
	timemodified: number;
	warnafter: number;
	blockafter: number;
	blockperiod: number;
	completiondiscussions: number;
	completionreplies: number;
	completionposts: number;
	cmid: number;
	numdiscussions?: number;
	cancreatediscussions?: boolean;
	istracked?: boolean;
};

export type MoodleDiscussion = {
	id: number;
	name: string;
	groupid: number;
	timemodified: number;
	usermodified: number;
	timestart: number;
	timeend: number;
	discussion: number;
	parent: number;
	userid: number;
	created: number;
	modified: number;
	mailed: number;
	subject: string;
	message: string;
	messageformat: number;
	messagetrust: number;
	attachment: string;
	totalscore: number;
	mailnow: number;
	userfullname: string;
	usermodifiedfullname?: string;
	userpictureurl: string;
	usermodifiedpictureurl?: string;
	numreplies: number;
	numunread: number;
	pinned: boolean;
	locked: boolean;
	starred?: boolean;
	canreply?: boolean;
	canlock?: boolean;
	canfavourite?: boolean;
};

export type CreatePostParams = {
	courseId: number;
	postType: PostType;
	subject: string;
	message: string;
};

export type MoodlePost = {
	id: number;
	subject: string;
	message: string;
	author: {
		id: number;
		fullname: string;
		isdeleted: boolean;
		groups: unknown[];
		urls: {
			profile?: string;
			profileimage?: string;
		};
	};
	timecreated: number;
	unread?: boolean;
	isdeleted: boolean;
	isprivatereply: boolean;
	haswordcount: boolean;
	wordcount?: number;
	charcount?: number;
	capabilities: {
		view: boolean;
		edit: boolean;
		delete: boolean;
		split: boolean;
		reply: boolean;
		selfenrol: boolean;
		export: boolean;
		controlreadstatus: boolean;
		canreplyprivately: boolean;
	};
	urls: {
		view?: string;
		viewisolated?: string;
		viewparent?: string;
		edit?: string;
		delete?: string;
		split?: string;
		reply?: string;
		export?: string;
		markasread?: string;
		markasunread?: string;
		discuss?: string;
	};
	attachments: unknown[];
	tags?: unknown[];
	html?: {
		rating?: string;
		taglist?: string;
		authorsubheading?: string;
	};
	parent: number;
	created: number;
	userfullname: string;
	userpictureurl: string;
};
