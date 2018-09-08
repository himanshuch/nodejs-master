/* helpers for various operations
*
*
*/
const crypto = require("crypto");
const config = require("../config");
const Mailgun = require('mailgun-js');
const stripe = require("stripe")("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

let helpers ={};

helpers.parseToJSONObject = function (str) {
	try{
		const obj =JSON.parse(str);
		return obj;
	}
	catch(e) {
		return {};
	}
};

// create a SHA256 hash
helpers.hash = function(str) {
	if(typeof(str) =='string' && str.length > 0){
		const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
		return hash;
	}else{
		return false;
	}
}

//crate random string of length n
helpers.createRandomString = function(str_length) {
	const strLen = (typeof(str_length)=="number" && str_length>0) ? str_length : false;
	if(strLen > 0){
		const possiblechars ='abcdefghijklmnopqrstuvwxyz0123456789';
		let str ='';
		for(let i = 0; i<strLen; i++){
			str += possiblechars.charAt(Math.floor(Math.random()*possiblechars.length));
		}
		return str;
	}else{
		return strLen;
	}
}

//make payment using Stripe API 
//https://stripe.com/docs/payouts
helpers.makePayment = function(email, amount, currency){
	const token = "tok_visa_debit";

	const charge = stripe.charges.create({
	  amount: amount,
	  currency: currency,
	  source: token,
	  receipt_email: email
	});
}

//mailgun to send receipt
helpers.sendMail = function(email, amount) {
	//Your api key, from Mailgun’s Control Panel
	var api_key = '';

	//Your domain, from the Mailgun Control Panel
	var domain = '';

	//Your sending email address
	var from_who = '';

	var mailgun = new Mailgun({apiKey: api_key, domain: domain});

    var data = {
    //Specify email data
      from: from_who,
    //The email to contact
      to: email,
    //Subject and text data  
      subject: 'Hello from Mailgun',
      html: `<html><head><title>Invoice</title></head><body><h3>Dear ${email},</h3><br><p>Below is your invoice.</p><br><p>--------------------</p><p>Total Amount: &${amount}</p><p>--------------------</p><br><br><h6>We hope to see you again soon!</h6></body></html>`
    }

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
            console.log("got an error: ", err);
        }
        //Else we can greet    and leave
        else {
            console.log(body);
        }
    });
}

module.exports = helpers;

