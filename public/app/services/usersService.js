app.service('UsersService', function(socket){
	this.users = function(){ 
		return [
			{name: "Armin", word:"test"},
			{name: "Paul", word:"testlong"},
			{name: "Sean", word:"tst"},
			{name: "Adam", word:"testsmall"}
		];
	}
});