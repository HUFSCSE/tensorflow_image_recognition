var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjextId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/tensorDB';
var fs = require('fs');

var imagePath;
var mongodb_data;

var findtensordb = function(db, callback) {
   fs.readFile('./path.txt', 'utf8', function(err, data) {
      // the data is passed to the callback in the second argument
      console.log("path "+data);
      imagePath = data;
      var cursor =db.collection('tensorDB').find({'ImagePath':data});
      cursor.each(function(err, doc) {
          assert.equal(err, null);
          if (doc != null) {
             mongodb_data=doc;
             console.dir(mongodb_data);
          } else {
             callback();
          }
       });
   });
};


var exec = require('child_process').exec,
    child;

var express =   require("express");
var app         =   express();

var multer  =   require('multer');

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
	callback(null, './uploads');

	//path.txt write
	fs.writeFile('./path.txt', '/home/gudrbscse/myapp/uploads/'+file.originalname, function(err) {
	  if(err) throw err;
	  console.log('File write completed');
	});
	//tensorflow run
	child = exec('python3 tensorflow_run.py',
	  function (error, stdout, stderr) {
	    console.log("1")
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	    else{
	       //mongodb run
	       MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		findtensordb(db, function() {
		    db.close();
		});
	      });
	      console.log("2");
	    }
	});
  },
  filename: function (req, file, callback) {
    console.log(file);
    callback(null, file.originalname);
  }
});

var upload = multer({ storage : storage}).single('userPhoto');

app.post('/result',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        setTimeout(function() {
             console.log("3");
             var strDB = JSON.stringify(mongodb_data);
             var objDB = JSON.parse(strDB);
	     //console.log(imagePath);

             fs.readFile(imagePath,function(err,data){
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write('<html lang="en">\n'+'<head>\n'+
		'<meta charset="utf-8">\n'+
		'</head>\n'+
		'<body>\n'+
			'<div>\n'+
				'<h1>RESULT</h1>\n');
		res.write('<img src="data:image/jpeg;base64,')
		res.write(new Buffer(data).toString('base64'));
		res.write('"/><br>'); 
		res.write('<h>result 1 : '+objDB.result_1+'<br>\n'+
				'match percent : '+objDB.result_1_rate+'<br><br>\n\n'+
				'result 2 : '+objDB.result_2+'<br>\n'+
				'match percent : '+objDB.result_2_rate+'<br><br>\n\n'+
				'result 3 : '+objDB.result_3+'<br>\n'+
				'match percent : '+objDB.result_3_rate+'<br><br>\n\n'+
				'result 4 : '+objDB.result_4+'<br>\n'+
				'match percent : '+objDB.result_4_rate+'<br><br>\n\n'+
				'result 5 : '+objDB.result_5+'<br>\n'+
				'match percent : '+objDB.result_5_rate+'</h>\n');
		res.end('</div>\n'+'</body>\n'+'</html>\n');
	      });
        }, 21000);
    });
});


app.get('/',function(req,res){
      res.sendFile(__dirname + "/index.html");
});

app.listen(3000,function(){
    console.log("Working on port 3000");
});


