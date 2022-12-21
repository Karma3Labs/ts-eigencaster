import  path from 'path'
import axios from "axios"
import { EthAddress, Follow } from "../types"
import { getFollowersOfAddress, getAllFollows, objectFlip } from "./utils"

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

type Pretrust = { i: number, v: number }[]
type LocalTrust =  { i: number, j: number, v: number }[]
type Entry = [ string, number ]

const askEigentrustAPI = async (usersCount: number, localTrust: LocalTrust, pretrust: Pretrust) => {
	console.time('Calculation duration')
	const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
	const res = await axios.post(eigentrustAPI, {
		localTrust: {
			scheme: 'inline',
			size: usersCount,
			entries: localTrust,
		},
		pretrust: {
			scheme: 'inline',
			size: usersCount,
			entries: pretrust,
		}
	})
	console.timeEnd('Calculation duration')

	return res.data.entries
}

function getUsersFromFollows(follows: Follow[]): EthAddress[] {
	// It seems that the users table doesn't contain all of the users in the follows table
	// That's why I construct the graph from the follows table
	const addresses = new Set()
	for (const { follower, followee } of follows) {
		addresses.add(follower)
		addresses.add(followee)
	}

	return Array.from(addresses) as EthAddress[]
}

export default async (address: EthAddress, limit = 10) => {
	const follows = await getAllFollows()
	const idsToAddresses = getUsersFromFollows(follows)
	const addressesToIds = objectFlip(idsToAddresses)
	console.log(`Fetched ${idsToAddresses.length} users`)

	const localTrust: LocalTrust = []
	for (const { follower, followee } of follows) {
		localTrust.push({
			i: +addressesToIds[follower],
			j: +addressesToIds[followee],
			v: 1
		})
	}
	console.log(`Generated localtrust with ${localTrust.length} entries`)

	const pretrust: Pretrust = []
	const followers = await getFollowersOfAddress(address)
	followers.forEach((follower) => {
		pretrust.push({
			i: +addressesToIds[follower],
			v: 1 / followers.size
		})
	})
	console.log(`Generated pretrust with ${pretrust.length} entries`)

	const res = await askEigentrustAPI(idsToAddresses.length, localTrust, pretrust)
	const globalTrust = res.map((entry: any) => [idsToAddresses[entry.i], entry.v])

	// Desc sort by similarity
	globalTrust.sort((a: Entry, b: Entry)  => b[1] - a[1]) 
	// Remove users that address already follows
	const suggestions = globalTrust.filter((s: Entry) => !followers.has(s[0])) 

	return suggestions.slice(0, limit)
}
