var express = require('express')
var app = express()
var fs = require('fs')

// Connect to mysql
var mysql = require('mysql')
var connection = mysql.createConnection({
	host : 'localhost',
	user : 'sensor2',
	password : 'a19921213',
	database : 'data'
});

connection.connect();	

//To Write the current time.
var dateTime = require('node-datetime');

//To Get IP addr.
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

count=0; // the number of input temperature data after start server.

//Work with http call command
//Write the temperature record in local txt file and DB.
app.get('/', function(req,res){
	
	//Send the current time and temperature to Client.
	if(req.query.temp && typeof req.query.temp!='undefined'){

		var dt = dateTime.create();
		var formatted = dt.format('Y-m-d H:M:S');
		res.send(formatted+' Temp:'+req.query.temp);
		console.log(formatted+' Temp:'+req.query.temp);
	
		//Write to local TXT file.
		fs.appendFile('LOG.txt',req.query.temp+'\n', function(err){
			if(err) throw err;
		});
			
		data={};
		data.seq=count++;
		data.type='T';	
		data.device='102';	
		data.unit='0';
		data.ip=addresses;
		data.value=req.query.temp;
	
		//Insert data to DB by query 
		connection.query('INSERT INTO sensors SET ?',data,function(err,rows,cols){
			if(err) throw err;
		
			console.log('Done Insert Query');	
		});
	}
	else{
		res.send('Unauthorized Access');
	}
})

app.get('/dump',function(req,res){

	//Get Recent data from DB by query
	connection.query('SELECT * from sensors ORDER BY id DESC LIMIT 1440',function(err,rows,cols){
		if(err) throw err;
		
		res.write('<html><head><title>This is the AS 1016 Temperature</title></head><body>');		
		res.write('<p>AS 1016 Temperature 20121628 Lee Chungseop</p>');	
		var dt = dateTime.create();
		var formatted = dt.format('Y-m-d H:M:S');
		//res.write('<p>Dump '+rows.length+' data at '+formatted+'</p>');
		//Send HTML table
		res.write('<table border="3">');
		res.write('<tr><th>Num</th><th>Time</th><th>Tempeature</th></tr>');
		for(var i=0;i<rows.length;i++){
			var row=rows[i];
			res.write('<tr>');
			res.write('<td>'+i+'</td><td>'+row.time+'</td><td>'+row.value+'</td>');
			res.write('</tr>');
		}	
		res.end('</table></body></html>');
		console.log('Complete');
	});
})

app.listen(3000, function(){
	console.log('tempeature measuring start')
})
