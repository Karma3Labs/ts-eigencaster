import { Follow, LocalTrust } from '../../types'

export type LocaltrustStrategy = (follows: Follow[]) => Promise<LocalTrust<number>>

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (follows: Follow[]): Promise<LocalTrust<number>> => {
	const localTrust: LocalTrust<number> = []
	for (const { followerFid, followingFid } of follows) {
		localTrust.push({
			i: followerFid,
			j: followingFid,
			v: 1
		})
	}

	return localTrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections
}