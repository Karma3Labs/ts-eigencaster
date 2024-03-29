import { EthAddress, Follow, Strategy }  from '../types'
import { getDB } from "../utils" 
import { config } from "../recommender/config"

export const getAllFollows = async (): Promise<Follow[]> => {
	const db = getDB()
	return db('following')
		.select()
}

export const getFollowersOfAddress = async (address: EthAddress): Promise<Set<EthAddress>> => {
	const db = getDB()
	const follows = await db('following')
		.where('following', address)
		.select()

	return new Set(follows.map((f: Follow) => f.followerFid))
}

export const objectFlip = (obj: Record<number, number>): Record<number, number> => {
	const ret: Record<string, number> = {}
	Object.keys(obj).forEach(key => {
	  //@ts-expect-error
	  ret[obj[key]] = key
	})
	return ret
}

/**
 * Set operations
*/
export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _union = new Set<T>(setA)
	for (const elem of setB) {
	  _union.add(elem)
	}
	return _union
}
  
export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _intersection = new Set<T>()
	for (const elem of setB) {
	  if (setA.has(elem)) {
		_intersection.add(elem)
	  }
	}
	return _intersection
  }

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _difference = new Set(setA)
	for (const elem of setB) {
	  _difference.delete(elem)
	}
	return _difference
}

export const getStrategyById = (strategyId: number): Strategy | undefined => {
	for (const [key, strategy] of config.rankingStrategies) {
	  if (strategy.strategy_id === strategyId) {
		return strategy;
	  }
	}
	return undefined;
  };
  
  export const getStrategy = (pretrust: string, localtrust: string, alpha: number): Strategy | undefined => {
	for (const [key, strategy] of config.rankingStrategies) {
	  if (strategy.pretrust === pretrust && strategy.localtrust === localtrust && strategy.alpha === alpha) {
		return strategy;
	  }
	}
	return undefined;
  };

  export const getAllStrategies = (): Strategy[] => {
	return Array.from(config.rankingStrategies.values());
  };
	