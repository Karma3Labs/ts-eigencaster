import { getGraphFromUsersTable } from "../utils";

function reputation(Ri_1: number, q: number, Ri_other: number, Wi: number, D: number): number {
	// Calculate the damping function
	const F = 1 - (1 / (1 + Math.exp((Ri_1 - D) / D)));
  
	// Calculate the expected value of the rating
	const Ei = Ri_1 / D;
  
	// Calculate the reputation value at time t
	const Ri = Ri_1 + (1/q) * F * Ri_other * (Wi - Ei);
  
	return Ri;
}

const main = async () => {
	const graph = await getGraphFromUsersTable()
}
