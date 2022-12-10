import { Knex } from 'knex';
import { User, Following, EthAddress } from './types'

export const saveFollow = async (db: Knex, follower: EthAddress, follows: Following[]) => {
	if (follows.length == 0)  {
		return
	}
	const toBeInserted = follows.map((f) => {
		return { follower, followee: f.address }
	})

	await db("follows")
		.insert(toBeInserted)
		.onConflict()
		.ignore()
}

export const saveUser = async (db: Knex, userObject: User) => {
	await db("users")
		.insert(userObject)
		.onConflict()
		.ignore();
}