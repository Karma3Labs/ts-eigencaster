import { AdjacencyMap, EthAddress, Follow }  from '../types'
import { getDB } from "../utils" 

export const getGraphFromUsersTable = async () => {
	const adjacencyMap: AdjacencyMap = {}
	const follows = await getAllFollows()
	const edges = follows.map(({follower, followee}: Follow) => [follower, followee])

	for (const [src, dest] of edges) {
		adjacencyMap[src] = adjacencyMap[src] || new Set()
		adjacencyMap[src].add(dest)
	}

	return adjacencyMap
}

export const getAllFollows = async () => {
	const db = getDB()
	return db('follows')
	.select('follower', 'followee');
}

export const getFollowersOfAddress = async (address: EthAddress) => {
	const db = getDB()
	return db('follows')
		.select('follower', 'followee')
		.where('follower', address);
}

export const objectFlip = (obj: Record<number, string>) => {
	const ret: Record<string, number> = {};
	Object.keys(obj).forEach(key => {
	  //@ts-expect-error
	  ret[obj[key]] = key;
	});
	return ret;
}

/**
 * Set operations
*/
export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _union = new Set<T>(setA);
	for (const elem of setB) {
	  _union.add(elem);
	}
	return _union;
}
  
export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _intersection = new Set<T>();
	for (const elem of setB) {
	  if (setA.has(elem)) {
		_intersection.add(elem);
	  }
	}
	return _intersection;
  }

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _difference = new Set(setA);
	for (const elem of setB) {
	  _difference.delete(elem);
	}
	return _difference;
}