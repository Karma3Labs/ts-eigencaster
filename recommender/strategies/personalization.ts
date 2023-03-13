import {GlobalTrust} from "../../types"
import {getDB} from "../../utils"
import {Knex} from "knex";
import Transaction = Knex.Transaction;

const db = getDB()

export type PersonalizationStrategy = (globalTrust: GlobalTrust, strategyId: number, id: number, limit: number) => Promise<number[]>

/**
 * Multiplies the global trust by 5 if the profile is followed by the user
 */
const useFollows: PersonalizationStrategy = async (globaltrust: GlobalTrust, strategyId: number, id: number, limit: number): Promise<number[]> => {
	const {rows} = await db.raw(`
        WITH profile_follows AS (SELECT profiles.fid AS following_id, profile_id AS follower_id
                                 FROM profiles
                                          INNER JOIN follows ON profiles.owner_address = follows.follower_address
                                 WHERE profile_id = :id)
        SELECT i, v * CASE WHEN follower_id = :id THEN 5 ELSE 1 END AS trust
        FROM globaltrust
                 LEFT JOIN profile_follows ON globaltrust.i = profile_follows.following_id
        ORDER BY trust DESC limit :limit
	`, {id, limit}) as { rows: { i: number, trust: number }[] }

	return rows.map(({i}: { i: number }) => i)
}

const useFollowsRecursive: PersonalizationStrategy = async (
	globaltrust: GlobalTrust,
	strategyId: number,
	id: number,
	limit: number,
): Promise<number[]> => {
	let rows: { i: number, v: number }[] = []
	await db.transaction(async (trx: Transaction) => {
		await trx.raw(`
            CREATE
            TEMPORARY TABLE f (
				i integer PRIMARY KEY,
				l double precision NOT NULL
			) ON COMMIT DROP
		`)
		await trx.raw(`
			INSERT INTO f (i, l)
			VALUES (:id, 0)
		`, {id})
		const extend = (weight: number) => trx.raw(`
			INSERT INTO f (i, l)
			SELECT pf.following, :weight
			FROM f JOIN profile_follows pf
			ON f.i = pf.follower ON CONFLICT (i) DO NOTHING
		`, {weight})
		await extend(0)
		await extend(3)
		await extend(2)
		rows = (await trx.raw(`
            WITH sorted AS (SELECT gt.i, gt.v * COALESCE(f.l, 1) AS v
                            FROM globaltrust gt
                                     LEFT JOIN f USING (i)
                            WHERE strategy_id = :strategyId)
            SELECT *
            FROM sorted
            ORDER BY v DESC LIMIT :limit
		`, {strategyId, limit})).rows as { i: number, v: number }[]
		return trx.commit()
	})
	return rows.map(({i}: { i: number }) => i)
}

const useLocalTrustRecursive: PersonalizationStrategy = async (
	globaltrust: GlobalTrust,
	strategyId: number,
	id: number,
	limit: number,
): Promise<number[]> => {
	let rows: { i: number, v: number }[] = []
	await db.transaction(async (trx: Transaction) => {
		const strategyRow = (await trx
				.select('localtrust', 'alpha')
				.from('strategies')
				.where({id: strategyId})
		)[0] as { localtrust: string, alpha: number }
		const {localtrust, alpha} = strategyRow
		await trx.raw(`
            CREATE
            TEMPORARY TABLE t (
				i integer PRIMARY KEY,
				v double precision NOT NULL
			) ON COMMIT DROP
		`)
		await trx.raw(`
			INSERT INTO t (i, v)
				SELECT i, v
				FROM globaltrust
				WHERE strategy_id = :strategyId
		`, {strategyId})
		const iterate = async () => {
			await trx.raw(`
				INSERT INTO t (i, v)
					SELECT j AS i, 0.1 * sum(lt.v * t.v)
					FROM weighted_localtrust lt
					JOIN t USING (i)
					WHERE lt.name = :localtrust
					GROUP BY j
					ON CONFLICT (i) DO UPDATE SET v = EXCLUDED.v
			`, {localtrust})
			await trx.raw(`
                UPDATE t
                SET v = v + 0.9
                WHERE i = :id
			`, {id})
		}
		await iterate()
		await iterate()
		rows = (await trx.raw(`
            WITH followings AS (SELECT following AS i, true AS matched
                                FROM profile_follows
                                WHERE follower = :id)
            SELECT i, v
            FROM t
                     LEFT JOIN followings f USING (i)
            WHERE i <> :id
              AND f.matched ISNULL
            ORDER BY v DESC LIMIT :limit
		`, {id, limit})).rows as { i: number, v: number }[]
		return trx.commit()
	})
	return rows.map(({i}: { i: number }) => i)
}

export const strategies: Record<string, PersonalizationStrategy> = {
	useFollows,
	useFollowsRecursive,
	useLocalTrustRecursive,
}