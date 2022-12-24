import  path from 'path'
import axios from "axios"
import { Cast, EthAddress, Follow } from "../types"
import { Pretrust, LocalTrust, GlobalTrust, Entry } from '../types'
import { getFollowersOfAddress, getAllFollows, objectFlip } from "./utils"
import { db } from '../server/db'
import { add } from 'lodash'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public follows: Follow[] = []
	public addresses: EthAddress[] = []
	public addressesToIds: Record<string, number> = {}

	async init() {
		this.follows = await getAllFollows()
		this.addresses = this.getUsersFromFollows(this.follows)
		this.addressesToIds = objectFlip(this.addresses)

		console.log(`Loaded ${this.addresses.length} users and ${this.follows.length} follows`)
	}

	async recommend(address: EthAddress, limit = 20) {
		const localtrust = await this.calculateLocalTrust(this.addresses, this.follows)
		const pretrust = await this.calculatePretrust(address, this.addresses, this.follows)

		const res = await this.requestEigentrust(
			this.convertLocaltrustToIds(localtrust),
			this.convertPretrustToIds(pretrust)
		)
		const globalTrust = this.convertGlobalTrustToAddresses(res);


		const globalTrustEntries: Entry[] = globalTrust.map((entry: GlobalTrust<EthAddress>[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 

		//TODO: Pagination
		return globalTrustEntries.map(([address]) => address).slice(0, limit)
	}

	async recommendUsers(address: EthAddress, limit = 20) {
		const suggestions = await this.recommend(address, 100)
		return db('users')
			.select(
				'*', 
				db.raw(`(select exists (select 1 from follows where followee = ? and follower = address)) as is_followed`, address)
			)
			.whereIn('address', suggestions)
			.limit(limit)
	}

	async recommendCasts(root: EthAddress, limit = 20) {
		const suggestions = await this.recommend(root, 50)

		const popularityScores = await db('casts').select(
			'sequence',
			db.raw('0.2 * reactions + 0.3 * recasts + 0.5 * watches as popularity')
		)
		.whereIn('address', suggestions)

		const scores: any = []
		for (const { sequence, popularity } of popularityScores) {
			const score =  popularity * 
			 ((suggestions.length - suggestions.indexOf(sequence)) / suggestions.length)

			scores[sequence] = score
		}
		const scoresEntries = Object.entries(scores)
		scoresEntries.sort((a: any, b: any) => b[1] - a[1])

		const sequences = scoresEntries.map(x => x[0]).slice(0, limit)
		const casts = await db('casts').select().whereIn('sequence', sequences)
		casts.sort((a: Cast, b: Cast) => scores[b.sequence] - scores[a.sequence])

		return casts
	}

	/**
	 * Basic pretrust calculation. Just pre-trust all users the same.
	*/
	async calculatePretrust(address: EthAddress, users: EthAddress[], follows: Follow[]): Promise<Pretrust<EthAddress>> {
		const pretrust: Pretrust<EthAddress> = []
		const followers = await getFollowersOfAddress(address)
		followers.forEach((follower) => {
			pretrust.push({
				i: follower,
				v: 1 / followers.size
			})
		})

		return pretrust
	}

	/**
	 * Generates basic localtrust by transforming all existing connections
	*/
	async calculateLocalTrust(users: EthAddress[], follows: Follow[]): Promise<LocalTrust<EthAddress>> {
		const localTrust: LocalTrust<EthAddress> = []
		for (const { follower, followee } of follows) {
			localTrust.push({
				i: follower,
				j: followee,
				v: 1
			})
		}

		console.log(`Generated localtrust with ${localTrust.length} entries`)
		return localTrust
	}

	async requestEigentrust(localTrust: LocalTrust<number>, pretrust: Pretrust<number>) {
		try {
			console.time('calculation')

			const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
			const res = await axios.post(eigentrustAPI, {
				localTrust: {
					scheme: 'inline',
					size: this.addresses.length,
					entries: localTrust,
				},
				pretrust: {
					scheme: 'inline',
					size: this.addresses.length,
					entries: pretrust,
				},
				alpha: 0.9
			})

			console.timeLog('calculation')
			return res.data.entries
		}
		catch (e) {
			throw new Error('Calculation did not succeed');
		}
	}

	/**
	 * Generate a list of users given all connections 
	 */
	private getUsersFromFollows(follows: Follow[]): EthAddress[] {
		// It seems that the users table doesn't contain all of the users in the follows table
		// That's why I construct the graph from the follows table
		const addresses = new Set()
		for (const { follower, followee } of follows) {
			addresses.add(follower)
			addresses.add(followee)
		}

		return Array.from(addresses) as EthAddress[]
	}


	/**
	 * Address to number conversions
	*/

	private convertLocaltrustToIds(localTrust: LocalTrust<EthAddress>): LocalTrust<number> {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.addressesToIds[i],
				j: +this.addressesToIds[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIds(preTrust: Pretrust<EthAddress>): Pretrust<number> {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.addressesToIds[i],
				v
			}
		}) 
	}

	private convertGlobalTrustToAddresses(globalTrust: GlobalTrust<number>): GlobalTrust<EthAddress> {
		return globalTrust.map(({ i, v }) => {
			return {
				i: this.addresses[i], 
				v
			}
		})
	}
}

