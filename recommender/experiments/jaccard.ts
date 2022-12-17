import { EthAddress, AdjacencyMap } from "../../types"
import { getGraphFromUsersTable, intersection, union } from "../utils"

/**
 * Here's a basic heuristic approach for suggesting users using the jaccard similarity.
 *  The algorithm uses the Jaccard similarity to calculate how similar each user
 *  is to a given "root" user, and then returns a list of suggested users
 *  (skipping the already followed ones) sorted by their Jaccard similarity with
 *  the root user.
 *  Test on : 0x8552042F2423E8596e08129855d47D3b1EEa8f03
*/

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

export default async (root: EthAddress, limit = 10) => {
	const adjacencyMap = await getGraphFromUsersTable()
	const similarities = Object.entries(calculateSimilarities(adjacencyMap, root))

	// Desc sort by similarity
	similarities.sort((a, b)  => b[1] - a[1]) 
	// Remove users that root already follows
	const suggestions = similarities.filter(s => !adjacencyMap[root].has(s[0])) 
	// Skip first user that is going to be root (since jaccard similarity = 1)
	return suggestions.slice(1, limit)
}
