import removeAccents from './removeAccents.helper';

export default function slug(str: string, id?: string | number) {
	str = removeAccents(str);
	str = str
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
	if (id) {
		str += `~${id}`;
	}
	return str;
}
