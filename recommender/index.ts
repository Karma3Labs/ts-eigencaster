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

	public globaltrust: GlobalTrust = []

	constructor(pretrustPicker: PretrustStrategy, localtrustPicker = localStrategies.follows, alpha = 0.5) {
		this.alpha = alpha
		this.localtrustPicker = localtrustPicker
		this.pretrustPicker = pretrustPicker.picker
		this.personalized = pretrustPicker.personalized
	}

	async load() {
		this.fids = await this.getAllProfiles()
		this.fidsToIds = objectFlip(this.fids)
		this.follows = await getAllFollows()

		if (!this.personalized) {
			this.globaltrust = await this.runEigentrust()
		}
	}

	async recommend(fid: number, limit = 20) {
		if (this.personalized) {
			this.globaltrust = await this.runEigentrust(fid)
		}
		const globalTrustEntries: Entry[] = this.globaltrust.map((entry: GlobalTrust[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 

		//TODO: Pagination
		return globalTrustEntries.map(([fid]) => fid).slice(0, limit)
	}

	
	async recommendProfiles(fid: number, limit = 20, includeFollowing: boolean = true) {
		const suggestions = await this.recommend(fid)
		const result: any[] = []

		await db.transaction(async (trx: Knex.Transaction) => {
			await this.populateRecommendationsTable(trx, suggestions)
			result.splice(0, 0, ...await trx
				.select(
					'profiles.*',
					'recommendations.rank',
					db.raw('follows_you.follower_fid NOTNULL as follows_you'),
					db.raw('you_follow.following_fid NOTNULL as you_follow'),
				)
				.from('profiles')
				.join('recommendations', 'profiles.fid', 'recommendations.fid')
				.leftJoin('following AS you_follow', function () {
					this
						.on('you_follow.follower_fid', '=', 'profiles.fid')
						.andOn('you_follow.following_fid', '=', db.raw('?', +fid))
				})
				.leftJoin('following AS follows_you', function () {
					this
						.on('follows_you.following_fid', '=', 'profiles.fid')
						.andOn('follows_you.follower_fid', '=', db.raw('?', +fid))
				})
				.where(function () {
					this.where('profiles.fid', '!=', db.raw('?', +fid))
					if (!includeFollowing) {
						this.whereNull('you_follow')
					}
				})
				.orderBy('rank')
				.limit(limit))
			await trx.commit()
		})
		return result
	}

	async recommendCasts(root: number, limit = 20) {
		const suggestions = await this.recommend(root, 50)

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

	async populateRecommendationsTable(trx: Knex.Transaction<any, any[]>, suggestions: any[]) {
		// Raw because Knex doesn't support temporary tables
		await trx.schema.raw(`
				CREATE TEMPORARY TABLE recommendations (
					rank integer PRIMARY KEY,
					fid integer NOT NULL UNIQUE  -- implies an index
				)
				ON COMMIT DROP
			`)

		let values = []
		for (const [index, fid] of suggestions.entries()) {
			values.push({rank: index, fid: +fid })
		}
		await trx.insert(values).into('recommendations')
	}

	private runEigentrust = async (fid?: number): Promise<GlobalTrust> => {
		const pretrust = await this.pretrustPicker(fid)
		const convertedPretrust = this.convertPretrustToIds(pretrust)

		const localtrust = await this.localtrustPicker(this.follows)
		const convertedLocaltrust = this.convertLocaltrustToIds(localtrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
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
				alpha: this.alpha
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
}

