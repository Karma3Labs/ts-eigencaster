import  path from 'path'
import axios from "axios"
import { Profile } from "../types"
import { Pretrust, LocalTrust, GlobalTrust, GlobalRank, Entry } from '../types'
import { objectFlip } from "./utils"
import { strategies as ptStrategies } from './strategies/pretrust'
import { strategies as ltStrategies } from './strategies/localtrust'
import { db } from '../server/db'

// TODO: Fix that ugly thingy
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public fids: number[] = []
	public fidsToIndex: Record<number, number> = {}
	public globaltrust: GlobalTrust = []

	async recalculate(strategyId: number) {
		this.fids = await this.getAllFids()
		this.fidsToIndex = objectFlip(this.fids)

		const strategy = await db('strategies')
			.where('id', strategyId)
			.first()

		const localtrustStrategy = ltStrategies[strategy.localtrust]
		const pretrustStrategy = ptStrategies[strategy.pretrust]

		console.time('localtrust_generation')
		const localtrust = await localtrustStrategy()
		console.timeEnd('localtrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		console.time('pretrust_generation')
		const pretrust = await pretrustStrategy()
		console.timeEnd('pretrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		this.globaltrust = await this.runEigentrust(localtrust, pretrust, strategy.alpha)
		console.log("Generated globaltrust")

		await this.saveGlobaltrust(strategyId)
	}

	async loadFromDB(strategyId: number) {
		this.fids = await this.getAllFids()
		this.fidsToIndex = objectFlip(this.fids)
		this.globaltrust = await Recommender.getGlobaltrustByStrategyId(strategyId)
		console.log(`Loaded ${this.globaltrust.length} globaltrust entries from DB`)
	}

	static async getGlobaltrustByStrategyId(strategyId: number, offset = 0, limit = 100): Promise<GlobalRank> {
		// const globaltrust = await db('globaltrust')
		// 	.where({ strategyId })
		// 	.select('i', 'username', 'v', db.raw('row_number() over (order by v desc) as rank'))
		// 	.innerJoin('profiles', 'profiles.fid', 'globaltrust.i')
		// 	.orderBy('v', 'desc')
		// 	.offset(offset)
		// 	.limit(limit)
		const globaltrust = await db.raw(`
		WITH 
		_followers AS (
			SELECT
				following_fid,
				count(follower_fid) AS followers_count
			FROM
				mv_follow_links
			GROUP BY following_fid
		),
		_following AS (
			SELECT
				follower_fid,
				count(following_fid) AS following_count
			FROM
				mv_follow_links
			GROUP BY
				follower_fid
		),
		_reactions AS (
			SELECT
				target_fid as author_fid, 
				SUM(CASE WHEN reaction_type = 1 THEN 1 ELSE 0 END) AS likes_count,
				SUM(CASE WHEN reaction_type = 2 THEN 1 ELSE 0 END) AS recasts_count
			FROM
				reactions
			WHERE
				reaction_type IN (1,2)
			GROUP BY
				target_fid
		),
		_replies AS (
			SELECT
				parent_fid as author_fid, 
				count(fid) as replies_count 
			FROM
				casts
			WHERE
				parent_hash IS NOT NULL
			GROUP by
				parent_fid
		),
		_mentions AS (
			WITH
				mention AS (
					SELECT fid as from_fid, unnest(mentions) as mention_fid 
					FROM casts 
					WHERE array_length(mentions, 1) > 0
				)
				SELECT
					mention_fid,
					count(from_fid) as mention_count
				FROM
					mention
				GROUP BY
					mention_fid
		)
			SELECT
				row_number() over (order by v desc) as rank,
				gt.i, 
				u.value as username,
				gt.v,
				_followers.followers_count as followers,
				_following.following_count as following,
				_reactions.likes_count as likes,
				_replies.replies_count as replies,
				_reactions.recasts_count as recasts,
				_mentions.mention_count as mentions
			FROM 
				globaltrust AS gt
				INNER JOIN user_data AS u ON (u.fid = gt.i and u.type=6)
				INNER JOIN _followers ON (u.fid = _followers.following_fid)
				INNER JOIN _following ON (u.fid = _following.follower_fid)
				INNER JOIN _reactions ON (u.fid = _reactions.author_fid)
				INNER JOIN _replies ON (u.fid = _replies.author_fid)
				INNER JOIN _mentions ON (u.fid = _mentions.mention_fid)
			WHERE strategy_id= :strategyId
			ORDER BY gt.v DESC
			OFFSET :offset
			LIMIT :limit
		`, { strategyId, offset, limit })

		if (!globaltrust.rows.length) {
			throw new Error(`No globaltrust found in DB for strategy id: ${strategyId}`)
		}

		console.log(`Number of globaltrust rows: ${globaltrust.rows.length}`)

		return globaltrust.rows
	}
	
	static async getGlobaltrustLength(strategyId: number): Promise<number> {
		const { count } = await db('globaltrust')
			.where({ strategyId })
			.count()
			.first()

		return +count
	}

	private runEigentrust = async (localtrust: LocalTrust, pretrust: Pretrust, alpha: number): Promise<GlobalTrust> => {
		const convertedLocaltrust = this.convertLocaltrustToIndeces(localtrust)
		const convertedPretrust = this.convertPretrustToIndeces(pretrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
			alpha
		)

		return this.parseGlobaltrust(res);
	}


	private parseGlobaltrust(globaltrust: GlobalTrust): GlobalTrust {
		const parsedGlobaltrust = globaltrust.map(({ i, v }) => {
			return {
				i: this.fids[i],
				v: +v
			}
		})

		return parsedGlobaltrust.sort((a, b) => b.v - a.v)
	}

	async requestEigentrust(localTrust: LocalTrust, pretrust: Pretrust, alpha: number) {
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
				alpha, 
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
	private async getAllFids(): Promise<number[]> {
		// const profiles = await db('profiles') .select('fid')
		const profiles = await db.raw(`
			with _profiles as (
				select 
					distinct on (fid) *
				from user_data 
				order by fid desc, id desc
				)
			select fid from _profiles 
			where deleted_at is null
		`)

		return profiles.rows.map(({ fid }: Profile) => fid)
	}

	/**
	 * Fid to index conversions
	*/

	private convertLocaltrustToIndeces(localTrust: LocalTrust): LocalTrust {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.fidsToIndex[i],
				j: +this.fidsToIndex[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIndeces(pretrust: Pretrust): Pretrust {
		return pretrust.map(({ i, v }) => {
			return {
				i: +this.fidsToIndex[i],
				v
			}
		}) 
	}

	private async saveGlobaltrust(strategyId: number) {
		const CHUNK_SIZE = 1000
		if (!this.globaltrust.length) {
			return
		}

		for (let i = 0; i < this.globaltrust.length; i += CHUNK_SIZE) {
			const chunk = this.globaltrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyId,
					...g
				}))
			
			await db('globaltrust')
				.insert(chunk)
				.onConflict(['strategy_id', 'i']).merge()
		}
	}

	static async getRankOfUser(strategyId: number, fid: number): Promise<number> {
		// const res = await db.with('globaltrust_ranks', (qb: any) => {
		// 	return qb.from('globaltrust')
		// 		.select('i', 'v', 'strategy_id', db.raw('row_number() over (order by v desc) as rank'))
		// 		.where('strategy_id', strategyId)
		// 		.orderBy('v', 'desc')
		// }).select('rank').from('globaltrust_ranks').where('i', fid).first()
		const res = await db.raw(`
			WITH globaltrust_ranks AS (
				SELECT i, v, strategy_id, row_number() over (order by v desc) as rank
				FROM globaltrust AS gt
				INNER JOIN user_data AS u ON (u.fid = gt.i and u.type=6)
				WHERE strategy_id=:strategyId
			) 
			SELECT rank FROM globaltrust_ranks WHERE i=:fid LIMIT 1
		`, {strategyId, fid})
		if (!res.rows.length) {
			throw new Error(`No entry found in DB for strategy id: ${strategyId}`)
		}
		return res.rows[0] && res.rows[0].rank
	}

	// async recommendProfiles(fid: number, limit = 20, includeFollowing: boolean = true) {
	// 	const suggestions = await this.recommend(fid)

	// 	const result = await db('profiles').select(
	// 		'profiles.*',
	// 		db.raw('follows_you.follower_fid NOTNULL as follows_you'),
	// 		db.raw('you_follow.following_fid NOTNULL as you_follow'),
	// 	)
	// 	.leftJoin('following AS follows_you', function (q: any) {
	// 		q
	// 			.on('follows_you.follower_fid', '=', 'profiles.fid')
	// 			.andOn('follows_you.following_fid', '=', fid)
	// 	})
	// 	.leftJoin('following AS you_follow', function (q: any) {
	// 		q
	// 			.on('you_follow.following_fid', '=', 'profiles.fid')
	// 			.andOn('you_follow.follower_fid', '=', fid)
	// 	})
	// 	.whereIn('profiles.fid', suggestions)
	// 	.modify((q: any) => !includeFollowing && q.whereNull('you_follow'))
	// 	.limit(limit)

	// 	return result.sort((a: Profile, b: Profile) => 
	// 		suggestions.indexOf(a.fid) - suggestions.indexOf(b.fid))
	// }

	// async recommendCasts(root: number, limit = 20) {
	// 	const suggestions = (await this.recommend(root)).slice(limit)

	// 	const popularityScores = await db('casts').select(
	// 		'hash',
	// 		'author_fid',
	// 		db.raw('0.2 * reactions + 0.3 * recasts + 0.5 * watches as popularity'),
	// 	)
	// 	.whereIn('author_fid', suggestions)

	// 	const scores: any = []
	// 	for (const { hash, popularity } of popularityScores) {
	// 		const score =  popularity * 
	// 		 ((suggestions.length - suggestions.indexOf(hash)) / suggestions.length)

	// 		scores[hash] = score
	// 	}
	// 	const scoresEntries = Object.entries(scores)
	// 	scoresEntries.sort((a: any, b: any) => b[1] - a[1])

	// 	const hashes  = scoresEntries.map(x => x[0]).slice(0, limit)
	// 	const casts = await db('casts').select().whereIn('hash', hashes)
	// 	casts.sort((a: Cast, b: Cast) => scores[b.hash] - scores[a.hash])

	// 	return casts
	// }
}