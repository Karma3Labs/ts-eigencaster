import { getFidByAddress, getFidByUsername, profileExists  } from "./db"

export const getFidFromQueryParams = async (query: Record<string, any>): Promise<number> => {
	if (query.fid) {
		if (isNaN(query.fid)) {
			throw new Error('Invalid fid') 
		}
		if (!(await profileExists(query.fid))) {
			throw new Error('Fid does not exist')
		}

		return +query.fid
	}

	if (query.address) {
		const stripped = (query.address as string).trim() 
		const fid = await getFidByAddress(stripped)

		if (!fid) {
			throw new Error('Address does not exist')
		}

		return fid
	}

	if (query.username) {
		const stripped = (query.username as string).trim() 
		const fid = await getFidByUsername(stripped)

		if (!fid) {
			throw new Error('Username does not exist')
		}

		return fid
	}

	throw new Error('Either address or username should be provided')
}