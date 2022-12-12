import { AdjacencyMap, Follow }  from '../types'
import { getDB } from "../utils" 

export const getGraphFromUsersTable = async () => {
	const db = getDB()
	const adjacencyMap: AdjacencyMap = {}
	const follows = await db('follows').select('follower', 'followee')
	const edges = follows.map(({follower, followee}: Follow) => [follower, followee])

	for (const [src, dest] of edges) {
		adjacencyMap[src] = adjacencyMap[src] || new Set()
		adjacencyMap[src].add(dest)
	}

	return adjacencyMap
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