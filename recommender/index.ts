import  path from 'path'
import axios from "axios"
import { AdjacencyMap, Cast, Follow, Profile } from "../types"
import { Pretrust, LocalTrust, GlobalTrust, Entry } from '../types'
import { getAllFollows, objectFlip } from "./utils"
import { PretrustPicker, PretrustStrategy, strategies as pretrustStrategies } from './strategies/pretrust'
import { LocaltrustStrategy, strategies as localStrategies } from './strategies/localtrust'
import { db } from '../server/db'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public follows: Follow[] = []
	public fids: number[] = []
	public fidsToIds: Record<number, number> = {}

	public localtrustPicker: LocaltrustStrategy = localStrategies.existingConnections
	public pretrustPicker: PretrustPicker = pretrustStrategies.pretrustAllEqually.picker
	public personalized = pretrustStrategies.pretrustAllEqually.personalized

	public globaltrust: GlobalTrust<number> = []

	async init(pretrustPicker: PretrustStrategy, localtrustPicker = localStrategies.follows) {
		this.fids = await this.getAllProfiles()
		this.fidsToIds = objectFlip(this.fids)
		this.follows = await getAllFollows()

		console.log(`Loaded ${this.fids.length} profiles and ${this.follows.length} follows`)

		this.localtrustPicker = localtrustPicker
		this.pretrustPicker = pretrustPicker.picker
		this.personalized = pretrustPicker.personalized

		if (!this.personalized) {
			console.log('Since the strategy is not personalized, we can precompute the global trust')
			this.globaltrust = await this.runEigentrust()
		}
	}

	async recommend(fid: number, limit = 20) {
		if (this.personalized) {
			this.globaltrust = await this.runEigentrust(fid)
		}
		const globalTrustEntries: Entry[] = this.globaltrust.map((entry: GlobalTrust<number>[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 
		console.log('Global trust', JSON.stringify(globalTrustEntries))

		//TODO: Pagination
		return globalTrustEntries.map(([fid]) => fid).slice(0, limit)
	}

	async recommendProfiles(fid: number, limit = 20) {
		const suggestions = await this.recommend(fid, 100)
		return db('profiles')
			.select(
				'*', 
				db.raw(`(select exists (select 1 from follows where follower_fid = ? and following_fid = address)) as you_follow`, fid),
				db.raw(`(select exists (select 1 from follows where follower_fid = address and following_fid = ?)) as follows_you`, fid)
			)
			.whereIn('fid', suggestions)
			.limit(limit)
	}

	async recommendCasts(root: number, limit = 20) {
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
	async calculatePretrust(follows: Follow[]): Promise<Pretrust<number>> {
		const pretrust: Pretrust<number> = []
		return pretrust
	}

	/**
	 * Generates basic localtrust by transforming all existing connections
	*/
	async calculateLocaltrust(follows: Follow[]): Promise<LocalTrust<number>> {
		const localTrust: LocalTrust<number> = []
		for (const { followingFid, followerFid } of follows) {
			localTrust.push({
				i: followerFid,
				j: followingFid,
				v: 1
			})
		}

		console.log(`Generated localtrust with ${localTrust.length} entries`)
		return localTrust
	}

	private runEigentrust = async (fid?: number): Promise<GlobalTrust<number>> => {
		const pretrust = await this.pretrustPicker(fid)
		const convertedPretrust = this.convertPretrustToIds(pretrust)
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		const localtrust = await this.localtrustPicker(this.follows)
		const convertedLocaltrust = this.convertLocaltrustToIds(localtrust)
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
		)

		return this.convertGlobaltrustToFids(res);
	}


	async requestEigentrust(localTrust: LocalTrust<number>, pretrust: Pretrust<number>) {
		try {
			console.time('calculation')

			const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
			const res = await axios.post(eigentrustAPI, {
				localTrust: {
					scheme: 'inline',
					size: this.fids.length,
					entries: localTrust,
				},
				pretrust: {
					scheme: 'inline',
					size: this.fids.length,
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
	private async getAllProfiles(): Promise<number[]> {
		const profiles = await db('profiles') .select('fid')

		return profiles.map(({ fid }: Profile) => fid)
	}

	/**
	 * Generate a list of follows given all connections 
	 */
	private async getAllFollows(): Promise<number[]> {
		const profiles = await db('profiles')
			.select('fid')

		return profiles.map(({ followerFid, followingFid }: Follow) => [followerFid, followingFid])
	}

	private getGraphFromUsersTable = async () => {
		const adjacencyMap: AdjacencyMap = {}

		for (const { followerFid, followingFid } of this.follows) {
			adjacencyMap[followerFid] = adjacencyMap[followerFid] || new Set()
			adjacencyMap[followerFid].add(followingFid)
		}

		return adjacencyMap
	}
	/**
	 * Address to number conversions
	*/

	private convertLocaltrustToIds(localTrust: LocalTrust<number>): LocalTrust<number> {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.fidsToIds[i],
				j: +this.fidsToIds[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIds(preTrust: Pretrust<number>): Pretrust<number> {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.fidsToIds[i],
				v
			}
		}) 
	}

	private convertGlobaltrustToFids(globalTrust: GlobalTrust<number>): GlobalTrust<number> {
		return globalTrust.map(({ i, v }) => {
			return {
				i: this.fids[i], 
				v
			}
		})
	}
}
