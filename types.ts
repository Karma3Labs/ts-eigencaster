export type EthAddress = string
export type AdjacencyMap = Record<EthAddress, Set<EthAddress>>

export type Pretrust<T> = { i: T, v: number }[]
export type GlobalTrust<T> = { i: T, v: number }[]
export type LocalTrust<T> =  { i: T, j: T, v: EthAddress | number }[]
export type Entry = [ string, number ]

export interface Follow {
	follower: EthAddress,
	followee: EthAddress
}

export interface User {
	id: number
	address: string
	username: string
	displayName: string
	avatarUrl: string
	avatarVerified: boolean
	followers: string
	following: string
	bio: string
	telegram: string
	referrer: string
	connectedAddress: string
	registeredAt: Date
	updatedAt: Date
	customMetrics: object
} 

export interface Cast {
	sequence: number,
	address: string,
	username: string,
	text: string,
	displayName: string,
	publishedAt: string,
	avatarUrl: string,
	avatarVerified: boolean,
	replyParentMerkleRoot: string,
	numReplyChildren: number,
	replyParentUsername: string,
	merkleRoot: string,
	threadMerkleRoot: string,
	reactions: number,
	recasts: number,
	watches: number,
	mentions: any[] | null,
}
