export const config = {
	localtrustStrategies: [
		'existingConnections',
		'rep3rec6m8l1enhancedConnections',
	],
	pretrustStrategies: [
		'pretrustAllEqually',
		'pretrustSpecificUsernames',
	],
	rankingStrategies: new Map<string,any>([
		['follows', { 
      strategy_id: 1 
      // pretrust: 'pretrustAllEqually',
			// localtrust: 'existingConnections',
			// alpha: 0.5,
		}], 
    ['engagement', {
      strategy_id: 3
			// pretrust: 'pretrustAllEqually',
			// localtrust: 'rep3rec6m8l1enhancedConnections',
			// alpha: 0.5
		}], 
    ['creator', {
      strategy_id: 5
			// pretrust: 'pretrustSpecificUsernames',
			// localtrust: 'existingConnections',
			// alpha: 0.5
		}], 
    ['active+OGs', {
      strategy_id: 7
			// pretrust: 'pretrustSpecificUsernames',
			// localtrust: 'rep3rec6m8l1enhancedConnections',
			// alpha: 0.5
		}],
  ]),
}