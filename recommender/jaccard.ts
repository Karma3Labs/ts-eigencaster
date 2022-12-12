import { getDB } from "../utils" 
import { EthAddress, AdjacencyMap, Follow } from "../types"
import { intersection, union } from "./utils"

const db = getDB()


/**
 * Here's a basic heuristic approach for suggesting users using the jaccard similarity.
 *  The algorithm uses the Jaccard similarity to calculate how similar each user
 *  is to a given "root" user, and then returns a list of suggested users
 *  (skipping the already followed ones) sorted by their Jaccard similarity with
 *  the root user.
*/

const getGraphFromUsersTable = async () => {
	const adjacencyMap: AdjacencyMap = {}
	const follows = await db('follows').select('follower', 'followee')
	const edges = follows.map(({follower, followee}: Follow) => [follower, followee])

	for (const [src, dest] of edges) {
		adjacencyMap[src] = adjacencyMap[src] || new Set()
		adjacencyMap[src].add(dest)
	}

	return adjacencyMap
}

const calculateSimilarities = (adjacencyMap: AdjacencyMap, root: EthAddress) => {
	const rootNeighbors = adjacencyMap[root]

	const similarity: Record<EthAddress, number> = {}
	for (const node in adjacencyMap) {
		const neighbors = adjacencyMap[node]

		const inter = intersection(neighbors, rootNeighbors)
		const un = union(neighbors, rootNeighbors)
		similarity[node] = inter.size / un.size
	}

	return similarity
}
const getSuggestedUsers = async (root: EthAddress, limit = 10) => {
	const adjacencyMap = await getGraphFromUsersTable()
	const similarities = Object.entries(calculateSimilarities(adjacencyMap, root))

	// Desc sort by similarity
	similarities.sort((a, b)  => b[1] - a[1]) 
	// Remove users that root already follows
	const suggestions = similarities.filter(s => !adjacencyMap[root].has(s[0])) 
	// Skip first user that is going to be root (since jaccard similarity = 1)
	return suggestions.slice(1, limit)
}

const main = async () => {
	const root = '0x92ffA028c5747FA978B84f7B164DFBCf60ab5854'
	const users = await getSuggestedUsers(root)
	console.log(users)
}

main()