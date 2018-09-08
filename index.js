/* Entry file for API
*
*
*/

const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

const server = http.createServer(function(req, res){

	const parsedUrl = url.parse(req.url, true);
	const path = parsedUrl.pathname;
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
			payload: buffer
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

});

server.listen(3000, function(){
	console.log("server listening in 3000 port.")
})

//Defining handler
let handlers ={};

handlers.hello = function(data, callback){
	callback(200, {"hello": "Hello World"});
}

handlers.notFound = function(data, callback){
	callback(404);
}

const router = {
	"hello" : handlers.hello
}