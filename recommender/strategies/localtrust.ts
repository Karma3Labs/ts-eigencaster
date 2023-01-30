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

	const likesCount = await db('likes')
		.select('fid', 'author_fid', db.raw('count(1) as count'))
		.innerJoin('casts', 'cast_hash', 'casts.hash')
		.groupBy('fid', 'author_fid')

	let maxLikes = likesCount
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let likesMap: {[k: string]: {[v: string]: number}} = {}
	for (const { fid, authorFid, count } of likesCount) {
		likesMap[fid] = likesMap[fid] || {}
		likesMap[fid][authorFid] = +count
	}
	
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
	const mentionsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { authorFid, mentionFid, count } of mentions.rows) {
		mentionsMap[authorFid] = mentionsMap[authorFid] || {}
		mentionsMap[authorFid][mentionFid] = +count
	}

	const repliesMap: {[k: string]: {[v: string]: number}} = {}
	const replies = await db('casts')
		.select('author_fid', 'reply_parent_fid', db.raw('count(1) as count'))
		.whereNotNull('reply_parent_fid')
		.groupBy('author_fid', 'reply_parent_fid')

	for (const { authorFid, replyParentFid, count } of replies) {
		repliesMap[replyParentFid] = repliesMap[replyParentFid] || {}
		repliesMap[replyParentFid][authorFid] = +count
	}

	for (const { followerFid, followingFid } of follows) {
		const likesCount = likesMap[followerFid] && likesMap[followerFid][followingFid] || 0
		const mentionsCount = mentionsMap[followerFid] && mentionsMap[followerFid][followingFid] || 0
		const repliesCount = repliesMap[followerFid] && repliesMap[followerFid][followingFid] || 0

		localTrust.push({
			i: followerFid,
			j: followingFid,
			v: 1 + likesCount + mentionsCount + repliesCount
		})
	}

	return localTrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	enhancedConnections
}