import { EthAddress, Follow }  from '../types'
import { getDB } from "../utils" 

export const getAllFollows = async (): Promise<Follow[]> => {
	const db = getDB()
	return db('follows')
		.select()
}

export const getFollowersOfAddress = async (address: EthAddress): Promise<Set<EthAddress>> => {
	const db = getDB()
	const follows = await db('follows')
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