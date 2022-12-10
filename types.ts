export type EthAddress = string

export interface DbCast {
	publishedAt: number,
	text: string,
	image: string,
	publisher: string
	numReplyChildren: number,
	reactions: number,
	recasts: number,
	watches: number
	replyParentUsername: number
	mentions: {address: string, username: string}[]
}
export interface Cast {
	body: {
		publishedAt: number,
		data: {
			text: string,
			image: string | null,
			replyParentMerkleRoot: null,
			threadMerkleRoot: null
		}
	},
	meta: {
		displayName: string,
		avatar: string,
		isVerifiedAvatar: boolean
	  	numReplyChildren: number
		reactions: {
			count: number,
			type: "Like"
		},
		recasts: {
			count: number
		},
		watches: {
			count: number
		},
		replyParentUsername: {
			username: null
		},
		mentions: {address: string, username: string}[]
	},
	merkleRoot: string,
	uri: string
}

export interface User {
  address: string;
  username: string;
  displayName: string;
  avatar: Avatar;
  followerCount: number;
  followingCount: number;
  isViewerFollowing: boolean;
  isFollowingViewer: boolean;
  profile: Profile;
  referrerUsername: string;
  viewerCanSendDirectCasts: boolean;
}

export interface Avatar {
  urlStr: string;
  isVerified: boolean;
}

export interface Following {
	address: string 
	username: string 
	displayName: string 
	avatar: Avatar 
	isViewerFollowing: boolean
	verifications: boolean[]
}

export interface Profile {
  bio: Bio;

  directMessageTargets: DirectMessageTargets;
}

export interface Bio {
  text: string;
  mentions: Mention[];
}

export interface Mention {
  addrStr: string;
  username: string;
  displayName: string;
  avatar: Avatar;
  registeredAt: number;
}

export interface DirectMessageTargets {
  [key: string]: DirectMessageTarget;
}

export interface DirectMessageTarget {
  available: boolean;
  registeredAt: number;
}

export interface ProfileResponse {
  result: {
    user: User;
  };
}