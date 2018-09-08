/* Handlers for Requests
*
*
*/
const _data = require("./data");
const helpers = require("./helpers");

let handlers ={};

//handler for ping
handlers.ping = function(data, callback) {
	callback(200);
}

//handler for users
handlers.users = function(data, callback) {
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	}else {
		callback(403);
	}
}

//container fo the users submethod
handlers._users = {};

//handler for users post
handlers._users.post = function(data, callback) {
	console.log("data",data)
	const name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
	const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && /[a-z0-9]+\@[a-z0-9]+\.[a-z0-9]+/g.test(data.payload.email.trim()) ? data.payload.email.trim() : false;
	const street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
	const password = typeof(data.payload.password) =='string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(name && email && street && password) {
		//see if the user doesn't exists
		_data.read('users', email, function(err, data) {
			if(err) {
				// Hash the password
				const hashedPwd =helpers.hash(password);
				if(hashedPwd){
					//create user object
					const userObject ={
						'name': name,
						'email':email,
						'street':street,
						'hashedPassword':hashedPwd
					};

					//Store the user
					_data.create('users', email, userObject, function(err) {
						if(!err){
							callback(201);
						}else{
							console.log(err);
							callback(500, {'Error' : 'could not create new user'});
						}
					});
				}else{
					callback(500, {'Error' : 'could not hash the pwd'});
				}
			}else{
				callback(400, {'Error' : 'User already Exists'} )
			}

		})
	}else{
		callback(400, {'Error' : 'Missing required parameters or re-check the inputs'});
	}
}

//handler for users get
handlers._users.get = function(data, callback) {
	//Check if email is valid
	const email = typeof(data.queryStringObject.email) =='string' && data.queryStringObject.email.trim().length > 0 && /[a-z0-9]+\@[a-z0-9]+\.[a-z0-9]+/g.test(data.queryStringObject.email.trim()) ? data.queryStringObject.email.trim() : false;
	if(email){
		//Get the headers
		const id = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		handlers._tokens.verifyToken(email, id, (isTokenValid) => {

			if(isTokenValid){
				//Look up for the user in File system
				_data.read('users', email, function(err, data) {
					if(!err && data){
						delete data.hashedPassword;
						callback(200, data);
					}else{
						callback(404, {'Error':'user not found'});
					}
				});
			}else{
				callback(403, {'Error':'Missing required Token in header or is Invalid'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters or re-check the inputs'});
	}
}

//handler for users put
handlers._users.put = function(data, callback) {
	
}

//handler for users delete
handlers._users.delete = function(data, callback) {
	
}

//handler for tokens
handlers.tokens = function(data, callback) {
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	}else {
		callback(403);
	}
}

// Container for the token handlers
handlers._tokens = {};

//handler for token post
handlers._tokens.post = function(data, callback) {
	const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && /[a-z0-9]+\@[a-z0-9]+\.[a-z0-9]+/g.test(data.payload.email.trim()) ? data.payload.email.trim() : false;
	const password = typeof(data.payload.password) =='string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	if(email && password){
		_data.read('users', email, function(err, userData) {
			if(!err && userData) {
				// Hash the password
				const hashedPwd =helpers.hash(password);
				if(hashedPwd == userData.hashedPassword){
					const tokenId = helpers.createRandomString(20);
					const expiryTime = Date.now() + 1000*60*60;
					const tokenObj ={
						'email' : email,
						'id': tokenId,
						'expiry': expiryTime
					}
					_data.create('tokens', tokenId, tokenObj, function(err) {
						if(!err){
							callback(200, tokenObj);
						}else{
							callback(500, {'Error' : 'couldn\'t create new token'});
						}
					});
				}else{
					callback(400, {'Error' : 'password didn\'t match for this user'});
				}
			}else{
				callback(400, {'Error' : 'couldn\'t find this user'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters or re-check the inputs'});
	}
}

//handler for token get
handlers._tokens.get = function(data, callback) {
	const id = typeof(data.queryStringObject.id) == 'string' ? data.queryStringObject.id : false;
	if(id){
		_data.read('tokens', id, (err, tokenData)=>{
			if(!err && tokenData){
				callback(200, tokenData);
			}else{
				callback(404, {'Error' : 'Invalid token'});
			}
		})
	}else{
		callback(404, {'Error' : 'Missing required parameters.'});
	}
}

//handler for token put
handlers._tokens.put = function(data, callback) {
	const id = typeof(data.payload.id) == 'string' ? data.payload.id : false;
	const extend = typeof(data.payload.extend) == 'boolean' ? data.payload.extend : false;
	if(id && extend){
		_data.read('tokens', id, (err, tokenData)=>{
			if(!err && tokenData){
				if(tokenData.expiry > Date.now()){
					tokenData.expiry = Date.now() + 1000*60*60;
					_data.update('tokens', id, tokenData, (err)=>{
						if(!err ){
							callback(200);
						}else{
							callback(500, {'Error' : 'could not update'});
						}
					});
				}else{
					callback(404, {'Error' : 'token has not expired'});
				}
			}else{
				callback(404, {'Error' : 'Invalid token'});
			}
		})
	}else{
		callback(400, {'Error' : 'Missing required parameters.'});
	}
}


//handler for token delete
handlers._tokens.delete = function(data, callback) {
	const id = typeof(data.queryStringObject.id) == 'string' ? data.queryStringObject.id : false;
	if(id){
		_data.read('tokens', id, (err, tokenData)=>{
			if(!err && tokenData){
				_data.delete('tokens', id, (err)=>{
					if(!err){
						callback(200);
					}else{
						callback(500, {'Error' : 'could not delete'});
					}
				});
			}else{
				callback(404, {'Error' : 'Invalid token'});
			}
		})
	}else{
		callback(400, {'Error' : 'Missing required parameters.'});
	}
}

handlers._tokens.verifyToken = function(email, tokenId, callback) {
	_data.read('tokens', tokenId, (err, tokenData) => {
		if (!err && tokenData) {
			if(tokenData.email == email && tokenData.expiry > Date.now()){
				callback(true);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
}

//handler for menu items
handlers.menu = function(data, callback) {
	const acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._menus[data.method](data, callback);
	}else {
		callback(403);
	}
}

// Container for the token handlers
handlers._menus = {};

// get menus
handlers._menus.getMenu = (callback) =>{
	_data.read('menus', 'menu', (err, menuData) => {
		if(!err && menuData){
			callback(true, menuData);
		}else{
			callback(false);
		}
	});
};

handlers._menus.validateItem = (items, callback) =>{
	_data.read('menus', 'menu', (err, menuData) => {
		if(!err && menuData){
			//start validating
			let menuArr =[];
			let ret;
			menuData["Pizzas"].forEach((item) =>{
				menuArr.push(item.name);
			})
			menuData["Sides"].forEach((item) =>{
				menuArr.push(item.name);
			})
			menuData["Desserts_Drinks"].forEach((item) =>{
				menuArr.push(item.name);
			})
			console.log(menuArr);
			console.log(items);
			ret = items.every((item)=>{
				return (menuArr.indexOf(item.item) >  -1);
			});
			callback(ret);

		}else{
			callback(false);
		}
	});
};



//handler for get menu
handlers._menus.get = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	if(email && header){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						//Return list of menus.
						_data.read('menus', 'menu', (err, menuData) => {
							if(!err && menuData){
								callback(200, menuData);
							}else{
								callback(500, {'Error' : 'Could not list the menus :('});
							}
						});
						
					}else{
						callback(400, {'Error' : 'Invalid token'});
					}
				})
			}else{
				callback(403, {'Error' : 'User not found'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters in queryString or header.'});
	}
}

//handler for cart items
handlers.cart = function(data, callback) {
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._cart[data.method](data, callback);
	}else {
		callback(403);
	}
}

// Container for the cart handlers
handlers._cart = {};

//handler for get cart
handlers._cart.get = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	if(email && header){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						//Return list of items in cart.
						_data.read('cart', email, (err, menuData) => {
							if(!err && menuData){
								callback(200, menuData);
							}else{
								callback(404, {'Error' : 'Your cart is Empty :( fill something from the menu'});
							}
						});
						
					}else{
						callback(400, {'Error' : 'Invalid token'});
					}
				})
			}else{
				callback(403, {'Error' : 'User not found'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters in queryString or header.'});
	}

}

//handler for update cart
handlers._cart.put = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	const payload = data.payload;
	// Todo validate payload
	if(email && header && payload){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						//check the payload against the menu available
						handlers._cart.validate(payload, (isValid) =>{
							if(isValid){
								// update cart for user
								_data.update("cart", email, payload, (err) =>{
									if(!err){
										callback(200);
										handlers._cart.getCost(email, (cost, err)=>{
											if(!err && cost){
												console.log("Cart value is : ", cost); 

											}
										});
									}else{
										callback(500, {'Error' : 'Internal server error'});
									}
								})
							}else{
								callback(500, {'Error' : 'wrong payload'});
							}
						})
					}else{
						callback(400, {'Error' : 'Invalid token'});
					}
				})
			}else{
				callback(403, {'Error' : 'User not found'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters in queryString or header or payload.'});
	}
}

//handler for validate payload
handlers._cart.validate = (payload, callback) => {
	let isValidPayload =false;
	// payload accepts array of objects {item, quantity}
	console.log(Array.isArray(payload));

	if(payload && Array.isArray(payload)){
		const isValidQty = payload.every(item =>{
			return item.quantity > 0;
		})
		if(isValidQty){
			handlers._menus.validateItem(payload, (isValid) =>{
				// isValidPayload = isValid;
				callback(isValid);
			})	
		}else{
			// isValidPayload = false;
			callback(false);
		}
		
	}else{
		callback(false);
	}
}

handlers._cart.getCost = (email, callback) => {
	let cost = 0;
	let menuArr =[];
	_data.read('cart', email, (err, usrData) => {
		if(!err && usrData){
			_data.read('menus', 'menu', (err, menuData) => {
				if(!err && menuData){
					menuData["Pizzas"].forEach((item) =>{
						menuArr.push(item);
					})
					menuData["Sides"].forEach((item) =>{
						menuArr.push(item);
					})
					menuData["Desserts_Drinks"].forEach((item) =>{
						menuArr.push(item);
					})
					usrData.forEach(item =>{
						cost += menuArr.find(menu => {
							return menu.name === item.item;
						}).price * item.quantity;
					})

					callback(cost, false);
					
				}else{
					callback(0, 'could not fetch menu\'s');
				}
			});
		}else{
			callback(0, 'cart details not available');
		}
	})

}


//handler for post cart
handlers._cart.post = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	const payload = data.payload;

	if(email && header && payload){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						//check the payload against the menu available
						handlers._cart.validate(payload, (isValid) =>{
							if(isValid){
								// create cart for user
								_data.create("cart", email, payload, (err) =>{
									if(!err){
										callback(200);
										handlers._cart.getCost(email, (cost, err)=>{
											if(!err && cost){
												console.log("Cart value is : ", cost); 
											}
										});
									}else{
										callback(500, {'Error' : 'Internal server error'});
									}
								})
							}else{
								callback(500, {'Error' : 'wrong payload'});
							}
						})
						
					}else{
						callback(400, {'Error' : 'Invalid token'});
					}
				})
			}else{
				callback(403, {'Error' : 'User not found'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters in queryString or header or payload.'});
	}
}

//handler for delete cart
handlers._cart.delete = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;

	if(email && header){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						// delete cart for user
						_data.delete("cart", email, (err) =>{
							if(!err){
								callback(200);
							}else{
								callback(500, {'Error' : 'could not delete cart'});
							}
						})
					}else{
						callback(400, {'Error' : 'Invalid token'});
					}
				})
			}else{
				callback(403, {'Error' : 'User not found'});
			}
		});
	}else{
		callback(400, {'Error' : 'Missing required parameters in queryString or header.'});
	}

}

//handler for payment
handlers.pay = function(data, callback) {
	const acceptableMethods = ['post'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._pay[data.method](data, callback);
	}else {
		callback(403);
	}
}

// Container for the payment handlers
handlers._pay = {};

handlers._pay.post = (data, callback) => {
	const email = typeof(data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false;
	const header = typeof(data.headers.token) == 'string' ? data.headers.token : false;

	if(email && header){
		_data.read('users', email, (err, userData) => {
			if (!err && userData) {
				handlers._tokens.verifyToken(email, header, (isTokenValid)=>{
					if(isTokenValid){
						handlers._cart.getCost(email, (cost, err)=>{
							if(!err && cost > 0){
								helpers.makePayment(email, "57", "JPY");
								callback(200);
								helpers.sendMail(email, cost);
							}else{
								callback(400, {'Error' : 'cart amount is 0.'});
							}
						});
					}
				});
			}
		});
	}
}

//handler for not found
handlers.notFound = function(data, callback){
	callback(404);
}

// Export handlers module
module.exports = handlers;