import { db } from '../../server/db';
import { Follow, Pretrust, Profile } from '../../types'

export type PretrustStrategy = (fid?: number) => Promise<Pretrust>

const pretrustAllEqually: PretrustStrategy = async () => {
	return [] as Pretrust
}

const pretrustSpecificUsernames: PretrustStrategy = async () => {
	const pretrustedUsernames = [
		'dwr', 'v', 'balajis', 'vbuterin','ccarella','tim','les','linda','ace','vm','cdixon' ]
	const pretrust: Pretrust = []

	// const fids = await db('profiles').select('fid').whereIn('username', pretrustedUsernames)
	const fids = await db.raw(`
		select 
			distinct fid
		from user_data 
		where 
			value in ('dwr', 'v', 'balajis', 'vbuterin','ccarella','tim','les','linda','ace','vm','cdixon')
	`)

	fids.rows.forEach(({ fid }: {fid: number}) => {
		pretrust.push({
			i: fid,
			v: 1 / pretrustedUsernames.length
		})
	})

	return pretrust
}

// const pretrustSpecificFids: PretrustStrategy = async () => {
// 	const pretrustedFids = [1, 2]
// 	const pretrust: Pretrust = []

// 	pretrustedFids.forEach((fid) => {
// 		pretrust.push({
// 			i: fid,
// 			v: 1 / pretrustedFids.length
// 		})
// 	})

// 	return pretrust
// }

// const pretrustFollowsOfFid: PretrustStrategy = async (fid?: number) => {
// 	const pretrust: Pretrust = []
// 	const follows = await db('following')
// 		.where('follower_fid', fid)
// 		.select()

// 	follows.forEach((follow: Follow) => {
// 		pretrust.push({
// 			i: follow.followingFid,
// 			v: 1 / follows.length
// 		})
// 	})

// 	return pretrust
// }

// const pretrustFirst20Profiles: PretrustStrategy = async () => {
// 	const pretrust: Pretrust = []
// 	const profiles = await db('profiles')
// 		.select('fid', 'registered_at')
// 		.orderBy('registered_at', 'asc')
// 		.limit(20)

// 	profiles.forEach((profile: Profile) => {
// 		pretrust.push({
// 			i: profile.fid,
// 			v: 1 / profiles.length
// 		})
// 	})

// 	return pretrust
// }

export const strategies: Record<string, PretrustStrategy> = {
	pretrustAllEqually,
	pretrustSpecificUsernames,
}
