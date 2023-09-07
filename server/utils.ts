import { db, getFidByAddress, getFidByUsername, profileExists  } from "./db"
import { strategies as pretrustStrategies } from "../recommender/strategies/pretrust"
import { strategies as localtrustStrategies } from "../recommender/strategies/localtrust"
import { config } from "../recommender/config"
import { getStrategyById } from "../recommender/utils"

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

export const getStrategyIdFromQueryParams = async (query: Record<string, any>): Promise<number> => {
	if (!query.strategy_id && !query.strategy) {
		throw Error('strategy or strategy_id is required')
	}

	if (query.strategy) {
		if (config.rankingStrategies.has(query.strategy)) {
			return +config.rankingStrategies.get(query.strategy).strategy_id
		}
	}

	if (isNaN(+query.strategy_id)) { 
		throw Error("Invalid strategy id")
	}

	const record = getStrategyById(query.strategy_id)
	if (!record) {
		throw new Error('Strategy id does not exist')
	}

	return +query.strategy_id
}