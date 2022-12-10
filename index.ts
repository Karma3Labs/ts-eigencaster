import axios from 'axios'
import { ProfileResponse, User, Following, EthAddress } from './types'
import { saveUser, saveFollow } from './db';
import { getDB } from './utils'; 

const BASE_URL = 'https://api.farcaster.xyz/v1'
const SEARCHCASTER_URL = 'http://api.farcaster.xyz/'
const db = getDB()

const getCastsOfUser = async (username: string) => {
	return await axios.get('http: ');
}

const getUserByAddress = async (profile: string): Promise<User> => {
	const res = await axios.get<ProfileResponse>(`${BASE_URL}/profiles/${profile}`);
	return res.data.result.user;
}

const getFollowing = async (profile: string): Promise<Following[]> => {
	const res = await axios.get<Following[]>(`${BASE_URL}/following/${profile}`)
	return res.data
}

const crawl = async (startingAddress: EthAddress) => {
	let queue: EthAddress[] = [startingAddress];
	let visited = new Set<EthAddress>()

	while (queue.length) {
		let userAddr = queue.shift() as EthAddress;
		if (!visited.has(userAddr)) {
			visited.add(userAddr)

			const user = await getUserByAddress(userAddr);
			await saveUser(db, user)

			const following = await getFollowing(userAddr)
			await saveFollow(db, userAddr, following)
			const neighbors = following.map(f => f.address)

			queue.push(...neighbors);
		}
	}

	console.log(`done with`);
};

crawl('0xc6e3004b0e54a91Da8d87ACe80B6Abc64D23e33F');