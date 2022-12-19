import  path from 'path'
import axios from "axios";
import { EthAddress } from "../types"
import { getFollowersOfAddress, getAllFollows, objectFlip } from "./utils"

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

type Pretrust = { i: number, v: number }[]
type LocalTrust =  { i: number, j: number, v: number }[]
type Entry = [ string, number ]

const askEigentrustAPI = async (usersCount: number, localTrust: LocalTrust, pretrust: Pretrust) => {
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

export default async (address: EthAddress, limit = 10) => {
	const follows = await getAllFollows()
	const addresses = new Set()
	for (const { follower, followee } of follows) {
		addresses.add(follower)
		addresses.add(followee)
	}
	const idsToAddresses = Array.from(addresses)
	const addressesToIds = objectFlip(idsToAddresses as Record<number, string>)
	console.log(`Fetched ${addresses.size} users`)

	const localTrust: LocalTrust = []
	for (const { follower, followee } of follows) {
		localTrust.push({
			i: +addressesToIds[follower],
			j: +addressesToIds[followee],
			v: 1
		})
	}
	console.log(`Generated localtrust with ${localTrust.length} entries`)

	const pretrust: Pretrust = [];
	const followers = await getFollowersOfAddress(address)
	const followersSet = new Set(followers)
	for (const { followee } of followers) {
		pretrust.push({
			i: +addressesToIds[followee],
			v: 1 / followers.length
		})
	}
	console.log(`Generated pretrust with ${pretrust.length} entries`)

	const res = await askEigentrustAPI(addresses.size, localTrust, pretrust)
	const globalTrust = res.map((entry: any) => [idsToAddresses[entry.i], entry.v])

	// Desc sort by similarity
	globalTrust.sort((a: Entry, b: Entry)  => b[1] - a[1]) 
	// Remove users that address already follows
	const suggestions = globalTrust.filter((s: Entry) => !followersSet.has(s[0])) 

	return suggestions.slice(0, limit)
}
