import { EthAddress } from "../types";
import { getDB } from "../utils";

export const db = getDB()

export const getUsers = (users: EthAddress[]) => {
	return db('users').select().whereIn('address', users)
}

export const getCasts = (sequences: number[]) => {
	return db('users').select().whereIn('sequence', sequences)
}

export const userExists = async (address: string) => {
	const [{ count }] = await db('users').where({ address }).count()
	return +count >= 1
}

export const getAddress = async (username: string): Promise<string> => {
	const record = await db('users')
		.where({ username })
		.first('address')

	return record?.address 
}