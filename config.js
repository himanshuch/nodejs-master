/*
* Create and export Configuration variables 
*
*/

let environments ={}

environments.staging ={
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'environmentName' : 'staging',
	'hashingSecret' : 'thisIsASecret'
}

environments.production ={
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'environmentName' : 'production',
	'hashingSecret' : 'thisIsASecret'
}

//Get current environment from command line else set to staging.
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//check if currentEnvironment is present in environments module if not set to staging.
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//export environment
module.exports = environmentToExport;