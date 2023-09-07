import { db } from '../../server/db';
import { Follow, Pretrust, Profile } from '../../types'

export type PretrustStrategy = (fid?: number) => Promise<Pretrust>

const pretrustAllEqually: PretrustStrategy = async () => {
	return [] as Pretrust
}

const pretrustSpecificUsernames: PretrustStrategy = async () => {
	const pretrustedUsernames = [
		'dwr.eth', 'varunsrin.eth', 'balajis.eth', 
		'vitalik.eth','ccarella.eth','tim',
		'lesgreys.eth','linda','ace',
		'vm','cdixon.eth' 
	]
	const pretrust: Pretrust = []

	// const fids = await db('profiles').select('fid').whereIn('username', pretrustedUsernames)
	const fids = await db.raw(`
		select 
			distinct fid
		from user_data 
		where 
			value in ('dwr.eth', 'varunsrin.eth', 'balajis.eth', 
								'vitalik.eth','ccarella.eth','tim',
								'lesgreys.eth','linda','ace',
								'vm','cdixon.eth')
			and type=6
	`)

	fids.rows.forEach(({ fid }: {fid: number}) => {
		pretrust.push({
			i: fid,
			v: 1 / pretrustedUsernames.length
		})
	})

	return pretrust
}

export const strategies: Record<string, PretrustStrategy> = {
	pretrustAllEqually,
	pretrustSpecificUsernames,
}
