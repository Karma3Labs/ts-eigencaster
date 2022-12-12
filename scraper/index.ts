import { saveUsers, saveFollows, saveCasts } from './db';
import { getUsers, getFollows, getCasts } from './fetch'
import { getDB } from '../utils'; 

const USER_BATCH = 100
const CAST_BATCH = 1000
const db = getDB()

const scrapeUsersAndFollows = async () => {
	let users: any[] = []
	let offset = 0
	do {
		console.log(`[USERS] Working on batch [${offset}, ${offset + USER_BATCH}]`)
		users = await getUsers(offset, USER_BATCH)
		await saveUsers(db, users)

		const followersPromises = users.map(u => getFollows(u.address))
		const followers = await Promise.all(followersPromises)
		for (const follows of followers) {
			await saveFollows(db, follows)
		}

		offset += USER_BATCH
	}
	while (users.length == USER_BATCH);
} 

const scrapeCasts = async () => {
	let casts: any[] = []
	let offset = 0
	do {
		console.log(`[CASTS] Working on batch [${offset}, ${offset + CAST_BATCH}]`)
		casts = await getCasts(offset, CAST_BATCH)
		await saveCasts(db, casts)
		offset += CAST_BATCH
	}
	while (casts.length == CAST_BATCH);
}


const main = async () => {
	await scrapeUsersAndFollows()
	await scrapeCasts()
}

main()