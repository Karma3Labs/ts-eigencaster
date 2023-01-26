import { EthAddress } from "../types";
import { getDB } from "../utils";

export const db = getDB()

export const getFidByAddress = async (address: EthAddress): Promise<number> => {
	const record = await db('profiles')
		.where({ address })
		.first('fid')

	return record?.fid 
}

export const profileExists = async (fid: number) => {
	const [{ count }] = await db('profiles').where({ fid }).count()
	return +count >= 1
}

export const getFidByUsername = async (username: string): Promise<number> => {
	const record = await db('profiles')
		.where({ username })
		.first('fid')

	return record?.fid 
}
