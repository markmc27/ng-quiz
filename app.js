var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var lessMiddleware = require('less-middleware');

var routes = require('./routes/index');
var presenter = require('./routes/presenter');

var app = express();
var server = http.createServer(app)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(lessMiddleware('/less', {
  dest: '/css',
  pathRoot: path.join(__dirname, 'public')
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/presenter', presenter);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require("socket.io").listen(server);

var presenterSocket = null,
//    questions = {
//                  1: {question: "What's your name?", answers: ["bob", "jeff", "fred"], correct: "jeff"}
//                },
    questions = require('./questions.json'),
    questionNum = 0,
    debug = true;
//console.log(questions);

io.sockets.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });

  console.log('new person connected!');
  /* Joining */
  socket.on('presenter:join', function(data) {
    socket.emit('debug', {debug: debug});
    presenterSocket = socket;
    questionNum = 1;
    //send first question to presenter
    presenterSocket.emit('server:question', {currentQuestion: questionNum, questionData: questions[questionNum]});
    presenterSocket.emit('server:maxQuestion', {max : Object.keys(questions).length})

    console.log('Presenter joined!');
  });

  socket.on('user:join', function(data) {
    console.log(data);

    presenterSocket.emit('user:join', { name: data.name });
  }); 

  /* User submitting answer */
  socket.on('user:submit', function(data) {
    console.log("User submitting word");

    presenterSocket.emit('user:submit', data);
  });

  /* GAME EVENTS */
  socket.on('game:countdown', function(data) {
    console.log("Time until start: " + data.seconds);

    io.sockets.emit('game:countdown', data); 
  });

  socket.on('game:round', function(data) {
    console.log("Time until round end: " + data.seconds);
    if(data.newQuestion){
          io.sockets.emit('game:nextQuestion', {currentQuestion: questionNum, question: questions[questionNum].question, answers: questions[questionNum].answers});
    }
    io.sockets.emit('game:round', data); 
  });

  socket.on('game:endround', function(data) {
    console.log("Round done!");
    //increase quesiton number 
    questionNum++;
    io.sockets.emit('game:endround', data); 

  });
    
socket.on('presenter:nextQuestion', function(){
    if(questionNum <= Object.keys(questions).length){
        console.log("Sending question: \n", {currentQuestion: questionNum, questionData: questions[questionNum]});
        presenterSocket.emit('server:question', {currentQuestion: questionNum, questionData: questions[questionNum]});
    }
});

  /* MISC */
  socket.on('debug', function(data){
    console.log(data.data);
  });

});

module.exports = app;
