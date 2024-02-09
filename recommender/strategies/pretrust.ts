import { db } from '../../server/db';
import { Follow, Pretrust, Profile } from '../../types'

export type PretrustStrategy = (fid?: number) => Promise<Pretrust>

const pretrustAllEqually: PretrustStrategy = async () => {
	return [] as Pretrust
}

const pretrustPopular: PretrustStrategy = async () => {
	const pretrust: Pretrust = []
	const limit = 20

	// const fids = await db('profiles').select('fid').whereIn('username', pretrustedUsernames)
	//TODO - use pretrustedUsernames variable in the db query
	const fids = await db.raw(`
		SELECT
			c.fid AS fid
		FROM
			reactions r
			INNER JOIN casts c ON c.hash = r.target_cast_hash
			INNER JOIN user_data u ON c.fid = u.fid AND u.type = 6
		WHERE
			r.timestamp >= current_timestamp - interval '7' day
		GROUP BY
			c.fid
		ORDER BY
			COUNT(*) DESC
		LIMIT :limit
	`, {limit})

	fids.rows.forEach(({ fid }: {fid: number}) => {
		pretrust.push({
			i: fid,
			v: 1 / limit
		})
	})

	return pretrust
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
	//TODO - use pretrustedUsernames variable in the db query
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
	pretrustPopular,
	pretrustSpecificUsernames,
}
