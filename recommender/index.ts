import  path from 'path'
import axios from "axios"
import { Cast, Follow, Profile } from "../types"
import { Pretrust, LocalTrust, GlobalTrust, Entry } from '../types'
import { getAllFollows, objectFlip } from "./utils"
import { PretrustPicker, PretrustStrategy, strategies as pretrustStrategies } from './strategies/pretrust'
import { LocaltrustStrategy, strategies as localStrategies } from './strategies/localtrust'
import { db } from '../server/db'
import { Knex } from 'knex'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public follows: Follow[] = []
	public fids: number[] = []
	public fidsToIds: Record<number, number> = {}

	public alpha: number
	public localtrustPicker: LocaltrustStrategy = localStrategies.existingConnections
	public pretrustPicker: PretrustPicker = pretrustStrategies.pretrustAllEqually.picker
	public personalized = pretrustStrategies.pretrustAllEqually.personalized

	public localtrust: LocalTrust = []
	public localtrustIds: LocalTrust = []
	public globaltrust: GlobalTrust = []

	constructor(pretrustPicker: PretrustStrategy, localtrustPicker = localStrategies.follows, alpha = 0.5) {
		this.alpha = alpha
		this.localtrustPicker = localtrustPicker
		this.pretrustPicker = pretrustPicker.picker
		this.personalized = pretrustPicker.personalized
	}

	async load(profiles?: number[], follows?: Follow[], localtrust?: LocalTrust) {
		this.fids = profiles || await this.getAllProfiles()
		this.fidsToIds = objectFlip(this.fids)
		this.follows = follows || await getAllFollows()
		this.localtrust = localtrust || await this.localtrustPicker(this.follows)
		this.localtrustIds  = this.convertLocaltrustToIds(this.localtrust)

		if (!this.personalized) {
			this.globaltrust = await this.runEigentrust()
		}
	}

	async recommend(fid: number) {
		if (this.personalized) {
			this.globaltrust = await this.runEigentrust(fid)
		}
		const globalTrustEntries: Entry[] = this.globaltrust.map((entry: GlobalTrust[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 

		//TODO: Pagination
		return globalTrustEntries.map(([fid]) => fid)
	}

	async recommendProfiles(fid: number, limit = 20, includeFollowing: boolean = true) {
		const suggestions = await this.recommend(fid)

		const result = await db('profiles').select(
			'profiles.*',
			db.raw('follows_you.follower_fid NOTNULL as follows_you'),
			db.raw('you_follow.following_fid NOTNULL as you_follow'),
		)
		.leftJoin('following AS follows_you', function (q: any) {
			q
				.on('follows_you.follower_fid', '=', 'profiles.fid')
				.andOn('follows_you.following_fid', '=', fid)
		})
		.leftJoin('following AS you_follow', function (q: any) {
			q
				.on('you_follow.following_fid', '=', 'profiles.fid')
				.andOn('you_follow.follower_fid', '=', fid)
		})
		.whereIn('profiles.fid', suggestions)
		.modify((q: any) => !includeFollowing && q.whereNull('you_follow'))
		.limit(limit)

		return result.sort((a: Profile, b: Profile) => 
			suggestions.indexOf(a.fid) - suggestions.indexOf(b.fid))
	}

	async recommendCasts(root: number, limit = 20) {
		const suggestions = (await this.recommend(root)).slice(limit)

		const popularityScores = await db('casts').select(
			'hash',
			'author_fid',
			db.raw('0.2 * reactions + 0.3 * recasts + 0.5 * watches as popularity'),
		)
		.whereIn('author_fid', suggestions)

		const scores: any = []
		for (const { hash, popularity } of popularityScores) {
			const score =  popularity * 
			 ((suggestions.length - suggestions.indexOf(hash)) / suggestions.length)

			scores[hash] = score
		}
		const scoresEntries = Object.entries(scores)
		scoresEntries.sort((a: any, b: any) => b[1] - a[1])

		const hashes  = scoresEntries.map(x => x[0]).slice(0, limit)
		const casts = await db('casts').select().whereIn('hash', hashes)
		casts.sort((a: Cast, b: Cast) => scores[b.hash] - scores[a.hash])

		return casts
	}

	private runEigentrust = async (fid?: number): Promise<GlobalTrust> => {
		const pretrust = await this.pretrustPicker(fid)
		const convertedPretrust = this.convertPretrustToIds(pretrust)

		const res = await this.requestEigentrust(
			this.localtrustIds,
			convertedPretrust,
		)

		return this.convertGlobaltrustToFids(res);
	}


	async requestEigentrust(localTrust: LocalTrust, pretrust: Pretrust) {
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
				alpha: this.alpha,
				epsilon: 1.0,
				flatTail: 2
			})

			console.timeEnd('calculation')
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
	 * FId to index conversions
	*/

	private convertLocaltrustToIds(localTrust: LocalTrust): LocalTrust {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.fidsToIds[i],
				j: +this.fidsToIds[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIds(preTrust: Pretrust): Pretrust {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.fidsToIds[i],
				v
			}
		}) 
	}

	private convertGlobaltrustToFids(globalTrust: GlobalTrust): GlobalTrust {
		return globalTrust.map(({ i, v }) => {
			return {
				i: this.fids[i], 
				v
			}
		})
	}

	static async getGlobaltrusts(pretrust: PretrustStrategy, localtrust: LocalTrust, alpha: number, profiles: number[], follows: Follow[]) {
		if (pretrust.personalized) {
			throw Error("Non personalized pretrust required")
		}

		// @ts-ignore
		const recommender =  new Recommender(pretrust, null, alpha)
		await recommender.load(profiles, follows, localtrust)
		const globalTrustEntries: Entry[] = recommender.globaltrust.map((entry: GlobalTrust[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 

		return globalTrustEntries.map(([fid]) => fid)
	}
}
