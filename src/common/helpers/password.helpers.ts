import bcrypt from 'bcryptjs';
import md5 from 'md5';

export const hashPassword = async (password: string) => {
	const b_hash = await bcrypt.hash(password, 10);
	const md5_hash = md5(password);
	return {
		bcrypt: b_hash,
		md5: md5_hash,
	}
};

export const comparePassword = async (password: string, hash: string) => {
	return await bcrypt.compare(password, hash);
};
