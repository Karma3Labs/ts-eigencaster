import { db } from '../../server/db'
import { Follow, LocalTrust } from '../../types'

export type LocaltrustStrategy = () => Promise<LocalTrust>

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	// const follows = await db('following')
	const follows = await db.raw(`
		select 
			distinct on (fid, target_fid) 
			fid as follower_fid, 
			target_fid as following_fid
		from links 
		where 
			type = 'follow'
		order by fid, target_fid, id desc
	`)

	const localTrust: LocalTrust = []

	for (const { followerFid, followingFid } of follows.rows) {
		localTrust.push({
			i: followerFid,
			j: followingFid,
			v: 1
		})
	}

	return localTrust
}

/**
 * Generates localtrust by taking into consuderation the number of likes between
 * two users.
*/
const rep3rec6m8l1enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	// const follows = await db('following')
	const follows = await db.raw(`
		select 
			distinct on (fid, target_fid) 
			fid as follower_fid, 
			target_fid as following_fid
		from links 
		where 
			type = 'follow'
		order by fid, target_fid, id desc
	`)
	const localTrust: LocalTrust = []

	/**
	 * Generate likes data
	*/
	console.time('likes')
	// const likes = await db('likes')
	// 	.select('fid', 'author_fid', db.raw('count(1) as count'))
	// 	.innerJoin('casts', 'cast_hash', 'casts.hash')
	// 	.groupBy('fid', 'author_fid')
	const likes = await db.raw(`
		select fid, target_fid as author_fid, count(1) as count 
		from reactions 
		where reaction_type=1
		group by fid, author_fid
	`)
	console.timeEnd('likes')

	const maxLikes = likes.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let likesMap: {[k: string]: {[v: string]: number}} = {}
	for (const { fid, authorFid, count } of likes.rows) {
		likesMap[fid] = likesMap[fid] || {}
		likesMap[fid][authorFid] = +count
	}
	
	/**
	 * Generate mentions data
	*/
	console.time('mentions')
	// const mentions = await db.raw(`
	// 	with m as (
	// 		select author_fid, unnest(mentions) as mention
	// 			from casts
	// 		where mentions <> '{}'
	// 	) 
	// 	select
	// 		author_fid, profiles.fid as mention_fid, count(1) as count
	// 			from m
	// 		inner join profiles
	// 			on profiles.username = mention::jsonb->>'username' group by 1, 2;
	// `)
	const mentions = await db.raw(`
		WITH mention AS (
			SELECT fid as author_fid, unnest(mentions) as mention_fid 
			FROM casts 
			WHERE array_length(mentions, 1) > 0
			)
		SELECT 
			author_fid, mention_fid, count(1) as count
		FROM mention
		GROUP BY 1, 2
	`)
	console.timeEnd('mentions')


	const maxMentions = mentions.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const mentionsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, mentionFid, count } of mentions.rows) {
		mentionsMap[authorFid] = mentionsMap[authorFid] || {}
		mentionsMap[authorFid][mentionFid] = +count
	}

	/**
	 * Generate replies data
	*/
	console.time('replies')
	// const replies = await db('casts')
	// 	.select('author_fid', 'reply_parent_fid', db.raw('count(1) as count'))
	// 	.whereNotNull('reply_parent_fid')
	// 	.groupBy('author_fid', 'reply_parent_fid')
	const replies = await db.raw(`
		SELECT fid as reply_fid, parent_fid as author_fid, count(1) as count 
		FROM casts
		WHERE parent_hash IS NOT NULL
		GROUP by reply_fid, author_fid
	`)
	console.timeEnd('replies')

	const maxReplies = replies.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const repliesMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, replyFid, count } of replies.rows) {
		repliesMap[replyFid] = repliesMap[replyFid] || {}
		repliesMap[replyFid][authorFid] = +count
	}

	/**
	 * Generate recasts data
	*/
	console.time('recasts')
	// const recasts = await db('casts')
	// 	.select('casts.author_fid as recaster_fid', 'c.author_fid', db.raw('count(1) as count'))
	// 	.innerJoin('casts as c', 'casts.recasted_cast_hash', 'c.hash')
	// 	.groupBy('recaster_fid', 'c.author_fid')
	const recasts = await db.raw(`
		select fid as recaster_fid, target_fid as author_fid, count(1) as count 
		from reactions 
		where reaction_type=2
		group by recaster_fid, author_fid
	`)
	console.timeEnd('recasts')

	let maxRecasts = recasts.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const recastsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, recasterFid, count } of recasts.rows) {
		recastsMap[recasterFid] = repliesMap[recasterFid] || {}
		recastsMap[recasterFid][authorFid] = +count
	}
	
	for (const { followerFid, followingFid } of follows.rows) {
		const likesCount = likesMap[followerFid] && likesMap[followerFid][followingFid] || 0
		const mentionsCount = mentionsMap[followerFid] && mentionsMap[followerFid][followingFid] || 0
		const repliesCount = repliesMap[followerFid] && repliesMap[followerFid][followingFid] || 0
		const recastsCount = recastsMap[followerFid] && recastsMap[followerFid][followingFid] || 0

		localTrust.push({
			i: followerFid,
			j: followingFid,
			v:  1 * (likesCount / maxLikes) + 
				3 * (repliesCount / maxReplies) + 
				6 * (recastsCount / maxRecasts) +
				8 * (mentionsCount / maxMentions) + 
				1
		})
	}

	return localTrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	rep3rec6m8l1enhancedConnections
}