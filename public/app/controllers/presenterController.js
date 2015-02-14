app.controller('AdminCtrl', function($scope, $interval, socket) {
    $scope.letters = ['A)', 'B)', 'C)', 'D)'];
	$scope.currentQuestion = 0;
	$scope.maxQuestion = -1;
	$scope.question = null;
	$scope.users = [];

	$scope.state = 'newround';

	$scope.presenterTimer = 5;

	$scope.roundState = '';

	var audioClock = new Audio("sound/clock-ticking.wav");
	var audioClong = new Audio("sound/clong.wav");
	var debugBool = false;
    var questionTime = 60;
	/* Game admin */
	//tell server a presenter has joined
  	socket.emit('presenter:join', {});
	//listen for users joining
	socket.on('user:join', function (data) {
        var exists = false;
        angular.forEach($scope.users, function(value, key) {
  			if(value.name == data.name) {
  				exists = true;
                return;
  			}
  		});	  
        if(!exists){
            $scope.users.push({name: data.name, points: 0, correct: 0});
        }

  	});
	//set max question
	socket.on('server:maxQuestion', function(data){
		debug(data);
		$scope.maxQuestion = data.max;
	});

	//listen for question from server
	socket.on('server:question', function(data){
        console.log("Question received: \n", data)
		$scope.currentQuestion = data.currentQuestion;
		$scope.question = data.questionData.question;
		$scope.answer = data.questionData.correct;
		$scope.answers = data.questionData.answers;
		debug("Question: " + $scope.question);
		debug("Answers: " + $scope.answers);
		debug("Answer: " + $scope.answer);
		console.log($scope.state)
	});

	//listen for answers + scores
	socket.on('server:results', function(data){

	});
	/* Rounds */
	//start Game
	$scope.startGame = function(){
		startGame();
	}

	//User submits answer
  	socket.on('user:submit', function(data) {
  		angular.forEach($scope.users, function(value, key) {
  			if(value.name == data.name) {
  				value.answer = data.answer;
  				if(value.answer === $scope.answer){
  					value.correct = 1;
  					value.points++;
  				}
                if(value.answer === ''){
                    value.answer = 'No answer';
                }
  			}
  		});

  	});

	//next round
	$scope.nextRound = function() {
        var currentQuestion = $scope.currentQuestion;
        debug('next round!');
		socket.emit('presenter:nextQuestion', {});
		$scope.state = 'newround';
        startGame();
	}
    
    //remove point for round
    $scope.disqualify = function(user) {
		user.points--;
	}

	/* Misc functions  */
	var debug = function(callback){
		if(debugBool){
			console.log(callback);
		}
	}

	socket.on('debug',function(data){
		debugBool = data.debug;
		console.log("DEBUG ", debugBool)
	});
    
    function startGame(){
        debug('start game');
		//socket.emit('debug', {data: "test"});
        //reset answers
//        angular.forEach($scope.users, function(value, key) {
//  				value.answer = '';
//  			}
//  		});

		$scope.state = 'roundplaying';

		startCountdown(function() {
			// Start the 30 second timer!
			runRound(function() {
				// Show the post-round screen
				console.log('round done!');
				
				finishRound();
			});
		});
    }

	function startCountdown(callback){
		var count = 5;

		$scope.roundState = 'countdown';
		debug($scope.roundState);

	    var interval = $interval(function() {
	        socket.emit('game:countdown', { seconds: count });
	        $scope.presenterTimer = count;
	        count--;

	        if(count == -1) {
	            callback();

	            $interval.cancel(interval);
	            interval = undefined;
	        }
	    }, 1000);
	}

	function runRound(callback) {
		console.log($scope.ad)
		audioClock.play();

		$scope.roundState = 'playing';

		var count = questionTime;
	    var interval = $interval(function() {
	        socket.emit('game:round', { seconds: count, newQuestion: count==questionTime });
	        $scope.presenterTimer = count;
	        count--;

	        if(count == -1) {
	            callback();

	            $interval.cancel(interval);
	            interval = undefined;
	        }
	    }, 1000);
	}

	function finishRound() {
		socket.emit('game:endround', {});

		audioClock.pause();
		audioClong.play();

		$scope.state = 'roundfinished';
		$scope.roundState = 'roundfinished';
	}
});