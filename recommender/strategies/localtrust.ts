import { db } from '../../server/db'
import { kvPair, LocalTrust, LocaltrustStrategy, FollowsLinksRecords, AttributesObject } from '../../types'

let attributes: AttributesObject = {
	likes: { map: {}, max: 0 },
	mentions: { map: {}, max: 0 },
	replies: { map: {}, max: 0 },
	recasts: { map: {}, max: 0 },
}

let follows: FollowsLinksRecords = []

const initializeFollows = async () => {
	if (follows.length === 0) {
		follows = await getFollows()
		console.log(`Slice of follows: ${JSON.stringify(follows.slice(0,10))}`)
	}
}

const initializeAttributes = async () => {
	if (Object.keys(attributes.likes.map).length === 0)
		await getLikesAttributes()
	if (Object.keys(attributes.replies.map).length === 0)
		await getRepliesAttributes()
	if (Object.keys(attributes.mentions.map).length === 0)
		await getMentionsAttributes()
	if (Object.keys(attributes.recasts.map).length === 0)
		await getRecastsAttributes()
}

const getFollows = async (): Promise<FollowsLinksRecords> => {
	const results = await db.raw(`
	  select 
		follower_fid, 
		following_fid,
		id
	  from
	  	mv_follow_links 
	  order by
	  	follower_fid, following_fid, id desc
	`)
	return results.rows;
}
  
  
/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	// const follows = await db('following')
	// const follows = await db.raw(`
	// 	select 
	// 		follower_fid, 
	// 		following_fid
	// 	from mv_follow_links 
	// 	order by fid, target_fid, id desc
	// `)
	await initializeFollows()

	const localTrust: LocalTrust = []
	for (const [index, value] of follows.entries()) {
		localTrust.push({
			i: value.followerFid,
			j: value.followingFid,
			v: 1
		})
	}

	return localTrust
}


/**
 * Generates localtrust for l1rep3rec6m8enhancedConnections
*/
const l1rep3rec6m8enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return await getCustomLocalTrust(1,3,6,8,1)
}

/**
 * Generates localtrust for l1rep6rec12m18enhancedConnections
*/
const l1rep6rec12m18enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return await getCustomLocalTrust(1,6,12,18,1)
}

/**
 * Generates localtrust for l8rep6rec3m1enhancedConnections
*/
const l8rep6rec3m1enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return await getCustomLocalTrust(8,6,3,1,1)
}

/**
 * Generates localtrust for l18rep12rec6m1enhancedConnections
*/
const l18rep12rec6m1enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return await getCustomLocalTrust(18,12,6,1,1)
}

/**
 * Generate likes data
*/
const getLikesAttributes = async () => {
	console.time('likes')
	// const likes = await db('likes')
	// 	.select('fid', 'author_fid', db.raw('count(1) as count'))
	// 	.innerJoin('casts', 'cast_hash', 'casts.hash')
	// 	.groupBy('fid', 'author_fid')
	const likes = await db.raw(`
		select fid, target_fid as author_fid, count(1) as count 
		from reactions 
		where reaction_type=1
		group by fid, author_fid
	`)
	console.timeEnd('likes')

	const maxLikes = likes.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const likesMap: kvPair = {};
	for (const { fid, authorFid, count } of likes.rows) {
		likesMap[fid] = likesMap[fid] || {}
		likesMap[fid][authorFid] = +count
	}

	attributes.likes.map = likesMap;
	attributes.likes.max = maxLikes;
  }


/**
 * Generate replies data
*/
const getRepliesAttributes = async () => {
	console.time('replies')
	// const replies = await db('casts')
	// 	.select('author_fid', 'reply_parent_fid', db.raw('count(1) as count'))
	// 	.whereNotNull('reply_parent_fid')
	// 	.groupBy('author_fid', 'reply_parent_fid')
	const replies = await db.raw(`
		SELECT fid as reply_fid, parent_fid as author_fid, count(1) as count 
		FROM casts
		WHERE parent_hash IS NOT NULL
		GROUP by reply_fid, author_fid
	`)
	console.timeEnd('replies')

	const maxReplies = replies.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const repliesMap: kvPair = {};
	for (const { authorFid, replyFid, count } of replies.rows) {
		repliesMap[replyFid] = repliesMap[replyFid] || {}
		repliesMap[replyFid][authorFid] = +count
	}

	attributes.replies.map = repliesMap;
	attributes.replies.max = maxReplies;
}


/**
 * Generate mentions data
*/
const getMentionsAttributes = async () => {
	console.time('mentions')
	// const mentions = await db.raw(`
	// 	with m as (
	// 		select author_fid, unnest(mentions) as mention
	// 			from casts
	// 		where mentions <> '{}'
	// 	) 
	// 	select
	// 		author_fid, profiles.fid as mention_fid, count(1) as count
	// 			from m
	// 		inner join profiles
	// 			on profiles.username = mention::jsonb->>'username' group by 1, 2;
	// `)
	const mentions = await db.raw(`
		WITH mention AS (
			SELECT fid as author_fid, unnest(mentions) as mention_fid 
			FROM casts 
			WHERE array_length(mentions, 1) > 0
			)
		SELECT 
			author_fid, mention_fid, count(1) as count
		FROM mention
		GROUP BY 1, 2
	`)
	console.timeEnd('mentions')

	const maxMentions = mentions.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const mentionsMap: kvPair = {}
	for (const { authorFid, mentionFid, count } of mentions.rows) {
		mentionsMap[authorFid] = mentionsMap[authorFid] || {}
		mentionsMap[authorFid][mentionFid] = +count
	}

	attributes.mentions.map = mentionsMap;
	attributes.mentions.max = maxMentions;
}


/**
 * Generate recasts data
*/
const getRecastsAttributes = async () => {

	console.time('recasts')
	// const recasts = await db('casts')
	// 	.select('casts.author_fid as recaster_fid', 'c.author_fid', db.raw('count(1) as count'))
	// 	.innerJoin('casts as c', 'casts.recasted_cast_hash', 'c.hash')
	// 	.groupBy('recaster_fid', 'c.author_fid')
	const recasts = await db.raw(`
		select fid as recaster_fid, target_fid as author_fid, count(1) as count 
		from reactions 
		where reaction_type=2
		group by recaster_fid, author_fid
	`)
	console.timeEnd('recasts')

	let maxRecasts = recasts.rows
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	const recastsMap: kvPair = {}
	for (const { authorFid, recasterFid, count } of recasts.rows) {
		recastsMap[recasterFid] = recastsMap[recasterFid] || {}
		recastsMap[recasterFid][authorFid] = +count
	}

	attributes.recasts.map = recastsMap;
	attributes.recasts.max = maxRecasts;
}


/**
 * We can now cusomize localtrusts in a more scalable way
*/
const getCustomLocalTrust = async (
	likesWeight: number,
	repliesWeight: number,
	recastsWeight: number,
	mentionsWeight: number,
	boostWeight: number
  ): Promise<LocalTrust> => {
	await initializeFollows()
	await initializeAttributes()

	const localTrust: LocalTrust = []
	for (const follow of follows) {
		const likesCount = attributes.likes.map[follow.followerFid] && attributes.likes.map[follow.followerFid][follow.followingFid] || 0
		const mentionsCount = attributes.mentions.map[follow.followerFid] && attributes.mentions.map[follow.followerFid][follow.followingFid] || 0
		const repliesCount = attributes.replies.map[follow.followerFid] && attributes.replies.map[follow.followerFid][follow.followingFid] || 0
		const recastsCount = attributes.recasts.map[follow.followerFid] && attributes.recasts.map[follow.followerFid][follow.followingFid] || 0
	
		localTrust.push({
			i: follow.followerFid,
			j: follow.followingFid,
			v:  likesWeight * (likesCount) + 
				repliesWeight * (repliesCount) + 
				recastsWeight * (recastsCount) +
				mentionsWeight * (mentionsCount) + 
				boostWeight
		})
	}

	return localTrust
  }

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	l1rep3rec6m8enhancedConnections,
	l1rep6rec12m18enhancedConnections,
	l8rep6rec3m1enhancedConnections,
	l18rep12rec6m1enhancedConnections,
}