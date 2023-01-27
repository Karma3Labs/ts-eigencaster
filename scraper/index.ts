import { saveProfiles, saveFollows, saveCasts, saveLikes } from './db'
import { getProfiles, getFollows, getCasts, getLikes } from './fetch'
import { getDB } from '../utils'

const BATCH_SIZE = 100
const db = getDB()

const scrapeProfiles = async () => {
	let profiles: any[] = []
	let offset = 0
	do {
		console.log(`[PROFILES] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		profiles = await getProfiles(offset, BATCH_SIZE)
		await saveProfiles(db, profiles)
		offset += BATCH_SIZE
	}
	while (profiles.length == BATCH_SIZE)
}

const scrapeFollows = async () => {
 	let follows: any[] = []
 	let offset = 0
 	do {
		console.log(`[FOLLOWS] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		follows = await getFollows(offset, BATCH_SIZE)
		offset += BATCH_SIZE
		await saveFollows(db, follows)
	}
	while (follows.length == BATCH_SIZE)
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

const scrapeLikes = async () => {
 	let likes: any[] = []
 	let offset = 0
 	do {
		console.log(`[LIKES] Working on batch [${offset}, ${offset + BATCH_SIZE}]`)
		likes = await getLikes(offset, BATCH_SIZE)
		await saveLikes(db, likes)
		offset += BATCH_SIZE
	}
	while (likes.length == BATCH_SIZE)
}

const main = async () => {
	// await scrapeProfiles()
	// await scrapeFollows()
	// await scrapeCasts()
	await scrapeLikes()
}

main()