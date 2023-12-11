export type EthAddress = string
export type AdjacencyMap = Record<number, Set<number>>

export type Pretrust = { i: number, v: number }[]
export type GlobalTrust = { i: number, v: number, username?: string, rank?: number }[]
export type LocalTrust =  { i: number, j: number, v: number, date: Date }[]
export type ExtendedProfile = {  }[]
export type Strategy = { strategy_id: number; pretrust: string; localtrust: string; alpha: number; };
export type GlobalRank = { i: number, v: number, username?: string, rank?: number, 
	following: number, followers: number, 
	likes: number, replies: number, 
	recasts: number, mentions: number 
}[]
export type Entry = [ number, number ]
export type kvPair =  {[k: string]: {[v: string]: number}} 

export type FollowsLinksRecords = { followerFid: number, followingFid: number, id: number }[]
export type LocaltrustStrategy = () => Promise<LocalTrust>
export type AttributeMaps = () => Promise<kvPair>;

export type AttributeWithMax = {
  map: kvPair;
  max: number;
}

export type AttributesObject = {
	likes: AttributeWithMax,
	mentions: AttributeWithMax,
	replies: AttributeWithMax,
	recasts: AttributeWithMax,
}
	
export interface Follow {
	followerFid: number,
	followingFid: number,
	createdAt: Date
}

export interface Like {
	type: string,
	fid: number,
	castHash: string,
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
	referrer: string
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
	replyParentHash: number,
	replyParentFid: number,
	reactions: number,
	recasts: number,
	watches: number,
	mentions: any[] | null,
	recasters: any[] | null
	recastedCastHash: string
	isRecast: boolean
}
