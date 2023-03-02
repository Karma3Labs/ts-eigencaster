import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import { getDB } from '../utils'

const db = getDB()

/**
 * 
 * Uses the pretrust and localtrust strategies to generate all possible
 * combinations and saves them to the DB.
*/
export const generateStrategies = async () => {
	const pretrustStrategies = Object.keys(ptStrategies)
	const localStrategies = Object.keys(ltStrategies)
	const ALPHAS = [0.5, 0.8]

	for (const pt of pretrustStrategies) {
		for (const lt of localStrategies) {
			for (const alpha of ALPHAS) {
				await db('strategies')
					.insert({ pretrust: pt, localtrust: lt, alpha })
					.onConflict(['pretrust', 'localtrust', 'alpha'])
					.ignore()
			}
		}
	}

	const strategies = await db('strategies')
	return strategies
}