import { db } from '../../server/db'
import { Follow, LocalTrust } from '../../types'

export type LocaltrustStrategy = (follows: Follow[]) => Promise<LocalTrust>

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (follows: Follow[]): Promise<LocalTrust> => {
	const localTrust: LocalTrust = []
	for (const { followerFid, followingFid } of follows) {
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
const enhancedConnections: LocaltrustStrategy = async (follows: Follow[]): Promise<LocalTrust> => {
	const localTrust: LocalTrust = []

	/**
	 * Generate likes data
	*/
	const likes = await db('likes')
		.select('fid', 'author_fid', db.raw('count(1) as count'))
		.innerJoin('casts', 'cast_hash', 'casts.hash')
		.groupBy('fid', 'author_fid')

	const maxLikes = likes
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let likesMap: {[k: string]: {[v: string]: number}} = {}
	for (const { fid, authorFid, count } of likes) {
		likesMap[fid] = likesMap[fid] || {}
		likesMap[fid][authorFid] = +count
	}
	
	/**
	 * Generate mentions data
	*/
	const mentions = await db.raw(`
		with m as (
			select author_fid, unnest(mentions) as mention
				from casts
			where mentions <> '{}'
		) 
		select
			author_fid, profiles.fid as mention_fid, count(1) as count
				from m
			inner join profiles
				on profiles.username = mention::jsonb->>'username' group by 1, 2;
	`)

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
	const replies = await db('casts')
		.select('author_fid', 'reply_parent_fid', db.raw('count(1) as count'))
		.whereNotNull('reply_parent_fid')
		.groupBy('author_fid', 'reply_parent_fid')

	const maxReplies = replies
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const repliesMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, replyParentFid, count } of replies) {
		repliesMap[replyParentFid] = repliesMap[replyParentFid] || {}
		repliesMap[replyParentFid][authorFid] = +count
	}

	/**
	 * Generate recasts data
	*/
	const recasts = await db('casts')
		.select('casts.author_fid as recaster_fid', 'c.author_fid', db.raw('count(1) as count'))
		.innerJoin('casts as c', 'casts.recasted_cast_hash', 'c.hash')
		.groupBy('recaster_fid', 'c.author_fid')

	let maxRecasts = recasts
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const recastsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, recasterFid, count } of recasts) {
		recastsMap[recasterFid] = repliesMap[recasterFid] || {}
		recastsMap[recasterFid][authorFid] = +count
	}
	
	for (const { followerFid, followingFid } of follows) {
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
	enhancedConnections
}