/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var openApi = require('./public/openApi.json')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('/', function (req, res) {
  res.json({ hello: "hello from cf app" })
})

app.get('/openapi', function (req, res) {
  res.json(openApi)
})


app.get('/hello', function (req, res) {
  res.json({ hello: "hello world" })
})

app.get('/hello/:name', function (req, res) {
  var name = req.params.name
  res.json({ hello: "hello " + name })
})

app.post('/hello/user', function(req, res) {
    var name = req.body.name;
    res.set('Content-Type', 'text/xml')
    res.send('<?xml version="1.0" encoding="UTF-8"?><text><para>hello ' + name  + '</para></text>');
});

app.put('/hello/user', function(req, res) {
    var name = req.body.name;
    res.send('Hello Updated ' + name + '. We just updated your info.');
});

app.delete('/hello/user', function(req, res) {
    var name = req.body.name;
    res.send('Hello ' + name + '. We just deleted your info.');
});

var port = process.env.PORT || 3000

var webServer = app.listen(port, function () {
    console.log('Listening on port %d', webServer.address().port)
})
