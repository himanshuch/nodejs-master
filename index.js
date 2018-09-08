/* Entry file for API
*
*
*/

const http = require("http");
const https = require("https");
const url = require("url");
const config = require("./config");
const StringDecoder = require("string_decoder").StringDecoder;
const fs = require("fs");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");
const _data = require("./lib/data");


let httpServer = http.createServer(function(req, res){
	unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function(){
	console.log("server listening in port "+ config.httpPort);
});

var httpsServerOption ={
	'key' : fs.readFileSync('./https/key.pm'),
	'cert': fs.readFileSync('./https/cert.pm')
}

let httpsServer = https.createServer(httpsServerOption, function(req, res){
	unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function(){
	console.log("server listening in port "+ config.httpsPort);
})

const unifiedServer = (req, res)=> {
	const parsedUrl = url.parse(req.url, true);
	const path = parsedUrl.pathname;
	//trim path having "/" in front or back
	const trimmedPath = path.replace(/^\/+|\/+$/g, '');

	const queryStringObject = parsedUrl.query;
	const method = req.method.toLowerCase();
	const headers = req.headers;

	const decoder = new StringDecoder('utf-8');
	let buffer ="";
	req.on('data', function(data){
		buffer += decoder.write(data);
	});

	req.on('end', function(){
		buffer += decoder.end();

		//Choose the handler this request should go to
		const chooseHandler = typeof(router[trimmedPath])!== "undefined" ? router[trimmedPath] : handlers.notFound;
		const data ={
			trimmedPath: trimmedPath,
			queryStringObject: queryStringObject,
			method: method,
			headers: headers,
			payload: helpers.parseToJSONObject(buffer)
		}

		//Choose handler
		chooseHandler(data, function(statusCode, payload){
			statusCode = typeof(statusCode) == "number" ? statusCode : 200;
			payload = typeof(payload) == "object" ? payload : {};

			const payloadString = JSON.stringify(payload);

			res.writeHead(statusCode);
			res.end(payloadString);

			console.log("Returning this response ",statusCode,payloadString);

		})

		console.log("Request received with this payload: "+buffer);
	});

	
	console.log("Request received on path: "+trimmedPath);
}

const router = {
	"ping" : handlers.ping,
	"users" : handlers.users,
	"tokens" : handlers.tokens,
	"menu" : handlers.menu,
	"cart" : handlers.cart,
	"pay" : handlers.pay
}