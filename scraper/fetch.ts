import axios from 'axios'
import { Cast, EthAddress, Follow, User } from '../types'

export const getUsers = async (offset: number, limit: number): Promise<User[]> => {
	const res = await queryDiscove(`select * from profiles limit ${limit} offset ${offset}`)
	const users: User[] = res.data.feed.results.map((r: Record<string, any>) => {
		return {
			id: r.id,
			address: r.address,
			username: r.username,
			displayName: r.display_name,
			avatarUrl: r.avatar_url,
			avatarVerified: r.avatar_verified,
			followers: r.followers || 0,
			following: r.following || 0,
			bio: r.bio,
			telegram: r.telegram || null,
			referrer: r.referrer || null,
			connectedAddress: r.connected_address,
			registeredAt: new Date(r.registered_at),
			updatedAt: new Date(r.updated_at),
			customMetrics: r.custom_metrics
		}
	})

	return users
}

export const getCasts = async (offset: number, limit: number): Promise<Cast[]> => {
	const res = await queryDiscove(`select * from casts limit ${limit} offset ${offset}`)
	const casts: Cast[] = res.data.feed.results.map((r: Record<string, any>) => {
		return {
			sequence: r.sequence,
			type: r.type,	
			publisher: r.address,
			text: r.text,
			reactions: r.reactions || 0,
			recasts: r.recasts || 0,
			watches: r.watches || 0,
			mentions: r.mentions.map((t: any) => t.address),
			replyTo: r?.reply_to_data?.sequence || null,
			metrics: r.custom_metrics.custom_cast_metrics
		} as Cast
	})

	return casts
}

export const getFollows = async (user: EthAddress): Promise<Follow[]> => {
	const res = await queryFarcaster(`/following/${user}`)
	const follows = res.map((f: Record<string, any>) => {
		return { 
			follower: user,
			followee: f.address
		} as Follow
	})

	return follows
}

export const queryFarcaster = async (endpoint: string) => {
	const BASE_URL = 'https://api.farcaster.xyz/v1'
	const res = await axios.get(`${BASE_URL}${endpoint}`)
	return res.data
}

export const queryDiscove = async (sql: string) => {
	const BASE_URL = 'https://www.discove.xyz/api/feeds'
	const res = await axios.get(`${BASE_URL}?sql=${sql}`)
	return res
}