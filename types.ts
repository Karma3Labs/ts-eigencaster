export type EthAddress = string

export interface Follow {
	follower: string,
	followee: string
}

export interface User {
	id: number;
	address: string;
	username: string;
	displayName: string;
	avatarUrl: string;
	avatarVerified: boolean;
	followers: string;
	following: string;
	bio: string;
	telegram: string;
	referrer: string;
	connectedAddress: string;
	registeredAt: Date;
	updatedAt: Date;
	customMetrics: object;
} 

export interface Cast {
	sequence: number,
	type: string,	
	publisher: string,
	text: string,
	mentions: any[]
	reactions: number
	recasts: number
	watches: number
	replyTo: number
	metrics: object
}
