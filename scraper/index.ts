import { saveUsers, saveFollows, saveCasts } from './db'
import { getUsers, getFollows, getCasts } from './fetch'
import { getDB } from '../utils'

const BATCH_SIZE = 100
const db = getDB()

const scrapeUsers = async () => {
	let users: any[] = []
	let offset = 0
	do {
		console.log(`[USERS] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		users = await getUsers(offset, BATCH_SIZE)
		await saveUsers(db, users)
		offset += BATCH_SIZE
	}
	while (users.length == BATCH_SIZE)
}

const scrapeFollows = async () => {
 	let users: any[] = []
 	let offset = 0
 	do {
		console.log(`[FOLLOWS] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		users = await db('users').select('address').orderBy('fid').offset(offset).limit(BATCH_SIZE)
		for (const { address } of users) {
			const follows = await getFollows(address)
			await saveFollows(db, follows)
		}
		offset += BATCH_SIZE
	}
	while (users.length == BATCH_SIZE)
}

const scrapeCasts = async () => {
 	let casts: any[] = []
 	let offset = 0
 	do {
		console.log(`[CASTS] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		casts = await getCasts(offset, BATCH_SIZE)
		await saveCasts(db, casts)
		offset += BATCH_SIZE
	}
	while (casts.length == BATCH_SIZE)
}

const main = async () => {
	await scrapeUsers()
	await scrapeFollows()
	await scrapeCasts()
}

main()