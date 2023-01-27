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
const likedConnections: LocaltrustStrategy = async (follows: Follow[]): Promise<LocalTrust> => {
	const localTrust: LocalTrust = []

	const likesCount = await db('likes')
		.select('fid', 'author_fid', db.raw('count(1) as count'))
		.innerJoin('casts', 'cast_hash', 'casts.hash')
		.groupBy('fid', 'author_fid')

	let maxLikes = likesCount
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let likesMap: {[k: string]: {[v: string]: number}} = {}
	for (const likes of likesCount) {
		likesMap[likes.fid] = likesMap[likes.fid] || {}
		likesMap[likes.fid][likes.authorFid] = likes.count
	}

	for (const { followerFid, followingFid } of follows) {
		localTrust.push({
			i: followerFid,
			j: followingFid,
			v: 1 + 2 * (likesMap[followerFid] && likesMap[followerFid][followingFid] || 0) / maxLikes
		})
	}

	return localTrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	likedConnections
}