import { db, getFidByAddress, getFidByUsername, profileExists  } from "./db"
import { strategies as pretrustStrategies } from "../recommender/strategies/pretrust"
import { strategies as localtrustStrategies } from "../recommender/strategies/localtrust"

export const getLocaltrustFromQueryParams = async (query: Record<string, any>) => {
	if (localtrustStrategies[query.localtrust]) {
		return localtrustStrategies[query.localtrust]
	} 

	throw new Error('Invalid localtrust')
}

export const getPretrustFromQueryParams = async (query: Record<string, any>) => {
	if (pretrustStrategies[query.pretrust]) {
		return pretrustStrategies[query.pretrust]
	} 

	throw new Error('Invalid pretrust')
}

export const getFidFromQueryParams = async (query: Record<string, any>): Promise<number> => {
	if (query.fid) {
		if (isNaN(query.fid)) {
			throw new Error('Invalid fid') 
		}
		if (!(await profileExists(query.fid))) {
			throw new Error('Fid does not exist')
		}

		return +query.fid
	}

	if (query.address) {
		const stripped = (query.address as string).trim() 
		const fid = await getFidByAddress(stripped)

		if (!fid) {
			throw new Error('Address does not exist')
		}

		return fid
	}

	if (query.username) {
		const stripped = (query.username as string).trim() 
		const fid = await getFidByUsername(stripped)

		if (!fid) {
			throw new Error('Username does not exist')
		}

		return fid
	}

	throw new Error('Either address or username should be provided')
}

export const getProfilesFromIds = async (ids: number[], offset = 0) => {
	console.log(ids)
	const profiles = await db('profiles').select('fid').count().innerJoin('following', 'profiles.fid', 'following_fid').groupBy('profiles.fid').whereIn('fid', ids)
	profiles.sort((a: any, b: any) => ids.indexOf(a.fid) - ids.indexOf(b.fid))
	return profiles.map((p: any, idx: number) => ({ id: p.fid, followers: +p.count, rank: offset + idx }))
}
