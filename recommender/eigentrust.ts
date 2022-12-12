import _ from 'lodash'
import { getGraphFromUsersTable } from './utils';

type Pretrust = Record<number,number>
type Grid = Record<number,Record<number,number>>
type PickerFn  = (values: Record<number, number>) => number;

/**
 * NOTE: The running time is veeery long for the farcaster network:
 * nodes: 6872
 * edges: 1075963
*/

class Recommender {
	trustGrid: Grid
	pretrust: Pretrust
	alpha: number
	iterations: number
	globalTrust: Record<number, number>
	picker: PickerFn
	partiesCount: number

	constructor(pretrust: Pretrust, alpha: number, iterations = 5, picker?: PickerFn) {
		if (Object.keys(pretrust).length = 0 && !this.isNormalized(pretrust)) {
			throw Error("p not normalized")
		}

		this.pretrust = pretrust
		this.globalTrust = pretrust
		this.trustGrid = this.createTrustGridFromPretrust(pretrust)
		this.partiesCount = Object.keys(pretrust).length
		this.alpha = alpha
		this.picker = picker || this.pickBest
		this.iterations = iterations
		// console.log('trustGrid', this.trustGrid)
	}	

	addParty(u: number) {
		if (u in this.trustGrid) {
			return
		}
		this.partiesCount++
		this.trustGrid[u] = {}

		// console.log('[ADD_PARTY] Parties count', this.partiesCount)

		if (Object.keys(this.pretrust).length == 0) {
			this.pretrust = this.createDefaultPretrust(this.partiesCount)
			// console.log('[ADD_PARTY] Using defaut pretrust', this.pretrust)
		}
		else {
			// console.log('[ADD_PARTY] Starting pretrust of user ', u, 'with zero')
			this.pretrust[u] = 0
		}

		for (let i in this.trustGrid) {
			this.trustGrid[+i][u] = 0
		}
		this.trustGrid[u] = _.clone(this.pretrust)
		// console.log('[ADD_PARTY] trustgrid after new Party', this.trustGrid)
	}

	vote(truster: number, trustee: number, vote: number) {
		if (Math.abs(vote) !== 1) {
			throw Error("Vote must be either -1 or 1")
		}
		// console.log('[VOTE] trustgrid on vote before adding parties', this.trustGrid)
		this.addParty(truster)
		this.addParty(trustee)
		// console.log('[VOTE] trustgrid on vote', this.trustGrid)

		this.trustGrid[truster][trustee] = Math.max(this.trustGrid[truster][trustee] + vote, 0)
		// console.log(`[VOTE] trustrgird after voting`, this.trustGrid)

		this.trustGrid[truster] = this.normalizeRecord(this.trustGrid[truster])
		this.trustGrid[trustee] = this.normalizeRecord(this.trustGrid[trustee])
		// console.log(`[VOTE] trustrgird after normalizing`, this.trustGrid)

		this.compute()
	}

	recommend(askingParty: number, V: number[]): ReturnType<PickerFn> {
		const candidates = _.pick(this.globalTrust, V)
		const res = this.picker(candidates)
        // console.log('For V, u', V, askingParty, 'recommening', res)
		return res
	}

	compute() {
		if (Object.keys(this.pretrust).length == 0) {
			return {}
		}
		let t = _.clone(this.pretrust)

		for (let i = 0; i < this.iterations; ++i) {
			t = this.iterate(t);
		}
		this.globalTrust = t
	}

	iterate(t0: Record<number, number>): Record<number, number> {
		const t1: Record<number, number> = {}
		// console.log('[ITERATE] t0', t0)

		for (const [truster, directTrust] of Object.entries(t0)) { // [key, value]
			for (const [trusted, indirectTrust] of Object.entries(this.trustGrid[+truster])) {
				if (trusted != truster) {
					if (!Object.keys(t1).includes(trusted)) {
						t1[+trusted] = 0
					}
					t1[+trusted] += directTrust * indirectTrust
					// console.log('[ITERATE]', truster, directTrust, trusted, indirectTrust, t1[+trusted])
				}
			}
		}
	
		// normalize the trust values
		// in the EigenTrust paper, this was not done every step, but I prefer to
		// Not doing it means the diff (d) needs to be normalized in
		// proportion to the values (because they increase with every iteration)
		const denom = this.sum(Array.from(Object.values(t1)))
		// Todo handle highestTrust == 0
		for (const [i, v] of Object.entries(t1)) {
			t1[+i] = (v / denom) * this.alpha + (1 - this.alpha) * this.pretrust[+i]
		}
	
		return t1
	}

	createTrustGridFromPretrust(pretrust: Pretrust) {
		const trustGrid: Grid = {}
		for (const truster in pretrust) {
			trustGrid[truster] = pretrust
		}

		return trustGrid
	}

	createDefaultPretrust(partiesCount = this.partiesCount) {
		const pretrust: Pretrust = {}
		for (const truster in this.trustGrid) {
			pretrust[truster] = 1 / partiesCount
			// console.log('[CREATE_DEFAULT_PRETRUST] parties count', partiesCount)
		}
		// console.log('[CREATE_DEFAULT_PRETRUST]', pretrust)

		return pretrust
	}

	normalizeRecord(record: Record<number, number>) {
		const maxTrust = this.sum(Object.values(record)) as number
		// console.log('maxTrust', maxTrust)
		// console.log('record before', record)
		const res = _.mapValues(record, v => v / maxTrust)
		// console.log('record after', res)
		return res
	}

 	isClose(a: number, b: number, error: number = 1e-10) {
		return Math.abs(a - b) < error
	}

	sum(arr: number[]) {
		return arr.reduce((acc, x) => acc + x, 0)
	}

	isNormalized(record: Record<string, number>) {
		return this.isClose(this.sum(Object.values(record)), 1)
	}

	pickBest(obj: Record<number, number>): number {
		return +Object.keys(obj).reduce((a, b) => obj[+a] > obj[+b] ? a : b)
	}
}

const main = async () => {
	const ALPHA = .3
	const adjacencyMap = await getGraphFromUsersTable()
	const keysToAddresses = Object.keys(adjacencyMap)
	const initialPretrust: Pretrust = {}
	for (const key in keysToAddresses) {
		initialPretrust[+key] = 1 / keysToAddresses.length
	}

	const recommender = new Recommender(initialPretrust, ALPHA);

	for (let [key, address] of Object.entries(keysToAddresses)) {
		const neighbors = Array.from(adjacencyMap[address])
		for (const neighborKey in neighbors) {
			console.log('Working on neighbor', neighborKey)
			recommender.vote(+key, +neighborKey, 1);
		}
	}

	const trusts = []
	for (const key in recommender.globalTrust) {
		trusts.push[keysToAddresses[key], recommender.globalTrust[key]]
	}

	trusts.sort((a, b)  => b[1] - a[1]) 
	return trusts
}

main()