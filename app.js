var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var helios = require('helios');

app.use(express.bodyParser());

app.get('/', function (req, res) {
    // Send usage information (static HTML)
});

app.get('/upload', function(req, res) {
    res.send("Perfrom HTTP POST with a JSON body");
}); 

app.post('/upload', function(req, res) {
    var json = JSON.parse(req.body);
    var id = json.id;
    var title = json.title;
    // Remove any control characters
    var content = json.content.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

    var solr_client = new helios.client({
        host : '192.168.99.100',  
        port : 32772,
        path : '/solr/gettingstarted', // Insert your client solr path 
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
        host : '192.168.99.100',  
        port : 32772,
        path : '/solr/gettingstarted', // Insert your client solr path 
        timeout : 1000  // Optional request timeout 
    });
    solr_client.select({
        deftype : "edismax",
        q : req.params.query,
        rows : 25,
        wt : "json"
        // and so on 
    }, function(err, result) {
        if (err) console.log(err);
        //console.log(result);
        var result_json = JSON.parse(result); // have to JSON.parse the res 
        var presentation = [];
        for (var rownum in result_json.response.docs) {
            var row = result_json.response.docs[rownum];
            var id = row.id;
            var title = row.title_s;
            var text = row.content_txt.toString().substring(0, 200);
            presentation.push({id : id, title : title, text : text});
        }
        res.send(JSON.stringify(presentation));
    });
});

app.listen(3000, function () {
    console.log('index access service listening on port 3000');
});