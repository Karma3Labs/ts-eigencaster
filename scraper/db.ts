import { Knex } from 'knex';
import { Cast, Follow, Like, Profile } from '../types'

export const saveFollows = async (db: Knex, follows: Follow[]) => {
	if (follows.length == 0)  {
		return
	}

	await db("follows")
		.insert(follows)
		.onConflict()
		.ignore()
}

export const saveProfiles = async (db: Knex, profiles: Profile[]) => {
	if (profiles.length == 0)  {
		return
	}

	await db("profiles")
		.insert(profiles)
		.onConflict()
		.ignore();
}

export const saveCasts = async (db: Knex, casts: Cast[]) => {
	if (casts.length == 0)  {
		return
	}

	await db("casts")
		.insert(casts)
		.onConflict()
		.ignore();
}

export const saveLikes = async (db: Knex, likes: Like[]) => {
	if (likes.length == 0)  {
		return
	}

	await db("likes")
		.insert(likes)
		.onConflict()
		.ignore();
}