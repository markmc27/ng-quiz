app.controller('GameCtrl', function($scope, socket) {
    $scope.letters = ['A)', 'B)', 'C)', 'D)'];
	$scope.name = '';

	$scope.timer = 60;

	$scope.state = 'join';

	$scope.currentQuestion = null;
	$scope.question = '';
	$scope.answers = '';
	$scope.answer = '';

	var selectedIndex = 0;
	

    /* JOIN */
	$scope.joinGame = function(){
		console.log('join game');

		socket.emit('user:join', {
	  		name: $scope.name
		});

		$scope.state = 'game';
	};

	/* Game */	
	socket.on('game:nextQuestion', function(data){
		console.log(data);
		$scope.currentQuestion = data.currentQuestion;
		$scope.question = data.question;
		$scope.answers = data.answers;
	});
	
	socket.on('game:countdown', function(data) {
		$scope.roundState = 'countdown';

		$scope.timer = data.seconds;
	});

	socket.on('game:round', function(data) {
		$scope.roundState = 'playing';

		$scope.timer = data.seconds;
	});

	socket.on('game:endround', function(data) {
		$scope.roundState = 'ended';

		console.log("My answer is: " + $scope.answer);

		socket.emit('user:submit', { name: $scope.name, answer:$scope.answer  });
        
        reset();

	});
    
    
    function reset(){
        $scope.currentQuestion = null;
		$scope.question = '';
		$scope.answers = '';
        $scope.answer = '';
    }
});