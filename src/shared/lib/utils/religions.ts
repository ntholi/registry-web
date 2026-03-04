const religions = [
	'Christianity',
	'Islam',
	'Hinduism',
	'Buddhism',
	'Judaism',
	'Sikhism',
	"Bahá'í Faith",
	'Jainism',
	'Shintoism',
	'Taoism',
	'Zoroastrianism',
	'Confucianism',
	'Traditional African Religion',
	'Rastafari',
	'Atheism',
	'Agnosticism',
	'Spiritual but not religious',
	'None',
] as const;

export function getReligions() {
	return religions.map((r) => ({ label: r, value: r }));
}
