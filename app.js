const express = require('express');
const fs = require('fs');
const app = express();
var http = require('http');
var server = require('http').createServer(app); 
var ent = require('ent');
const SerialPort = require("serialport");
const SerialPortParser = require("@serialport/parser-readline");
const GPS = require("gps");
const Request = require("request-promise");

const port = new SerialPort("/dev/ttyS0", { baudRate: 9600 });
const gps = new GPS();

const APP_ID = "8ODyPeZUjceXCI0L42Qi";
const APP_CODE = "9fd3O2jpeuHiFnHzC-QcJA";

const parser = port.pipe(new SerialPortParser());

var server = http.createServer(function (req, res) {
  fs.readFile('./indexe.html','utf-8', function(error, content){
	res.writeHead(200,{"Content-Type":"text/html"});
	res.end(content);
  });
});

var io = require('socket.io').listen(server);
function getAddressInformation(latitude, longitude) {
	   let address = {};
    return Request({
        uri: "https://reverse.geocoder.api.here.com/6.2/reversegeocode.json",
        qs: {
            "app_id": APP_ID,
            "app_code": APP_CODE,
            "mode": "retrieveAddress",
            "prox": latitude + "," + longitude
        },
        json: true
    }).then(result => {
        if (result.Response.View.length > 0 && result.Response.View[0].Result.length > 0) {
            address = result.Response.View[0].Result[0].Location.Address;
        }
        return address;
    });
}

io.sockets.on('connection',function(socket,data){
 socket.emit('message','vus etes bien cnnecte ');
 gps.on("data", async data => {
    if(data.type == "GGA") {
        if(data.quality != null) {
	     try {
                let address = await getAddressInformation(data.lat, data.lon);
		console.log(address.Label + " [" + data.lat + ", " + data.lon + "]");
		socket.on('petit_nouveau',function(data){
			socket.data = data ;
		});
	     }catch(e) {
		console.log(e);
	     }
        }
	else {
            console.log("no gps fix available");
        }
    }
});



parser.on("data", data => {
     try {
        gps.update(data);
    }catch (e) {
        throw e;
    }
});

});


server.listen(8080);
