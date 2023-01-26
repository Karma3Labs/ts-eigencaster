export type EthAddress = string
export type AdjacencyMap = Record<number, Set<number>>

export type Pretrust = { i: number, v: number }[]
export type GlobalTrust = { i: number, v: number }[]
export type LocalTrust =  { i: number, j: number, v: number }[]
export type Entry = [ number, number ]

export interface Follow {
	followerFid: number,
	followingFid: number,
	createdAt: Date
}

export interface Profile {
	fid: number
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
	youFollow?: boolean
	followsYou?: boolean
}

export interface Cast {
	hash: string,
	threadHash: string,
	authorFid: number,
	address: string,
	username: string,
	text: string,
	displayName: string,
	publishedAt: string,
	avatarUrl: string,
	avatarVerified: boolean,
	replyToData: any,
	replyParentUsername: string,
	reactions: number,
	recasts: number,
	watches: number,
	mentions: any[] | null,
}
