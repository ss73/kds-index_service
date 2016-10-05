var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var helios = require('helios');
var bodyParser = require('body-parser')

var solr_host = process.env.SOLR_PORT_8983_TCP_ADDR == null ? 
    "localhost" : process.env.SOLR_PORT_8983_TCP_ADDR;
var solr_port = process.env.SOLR_PORT_8983_TCP_PORT == null ? 
    8983 : process.env.SOLR_PORT_8983_TCP_PORT;
var solr_index = "/solr/archive";

//app.use(bodyParser.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/info.html'));
});

app.get('/upload', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/upload.html'));
}); 

app.post('/upload', function(req, res) {
    console.log('Request type: ' + req.headers['content-type']);
    var json = req.body;
    var id = json.id;
    var title = json.title;
    // Remove any control characters
    var content = json.content.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

    var solr_client = new helios.client({
        host : solr_host,  
        port : solr_port,
        path : solr_index, 
        timeout : 1000  // Optional request timeout 
    });
    var solrdoc = new helios.document();
    solrdoc.addField('id', id);
    solrdoc.addField('title_s', title);
    solrdoc.addField('content_txt', content);
 
    // Document, commit <true|false>, callback
    solr_client.addDoc(solrdoc, true, function(err) {
        if (err) console.log(err);
    });
    res.send("OK\n");
});

app.get('/find/:query', function(req, res){
    var solr_client = new helios.client({
        host : solr_host,  
        port : solr_port,
        path : solr_index,
        timeout : 1000  // Optional request timeout 
    });
    solr_client.select({
        deftype : "edismax",
        q : req.params.query,
        rows : 25,
        wt : "json"
    }, function(err, result) {
        if (err) console.log(err);
        var result_json = JSON.parse(result); // have to JSON.parse the res 
        var presentation = [];
        for (var rownum in result_json.response.docs) {
            var row = result_json.response.docs[rownum];
            var id = row.id;
            var title = row.title_s;
            var text = new String(row.content_txt).substring(0, 400);
            presentation.push({id : id, title : title, text : text});
        }
        res.json(presentation);
    });
});

app.listen(3000, function () {
    console.log('index access service listening on port 3000');
});
