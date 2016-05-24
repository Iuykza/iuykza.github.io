angular.module('scheduleApp')
.service('ajaxService', ['$http', function($http){
	var server = 'http://api.shiftswapsanity.xyz/';

	this.getUsers = function(callback){
		return $http.get(server+'users')
		.then(callback)
		.catch(function(error){
			console.log('Error, JSON file "users.json" is broken.  Reason: ',error);
		});
	};


	this.getWeek = function(week, callback){
		console.log('GET floor/'+week);
		$http.get(server+'schedule/role/floor/'+week)
		.then(callback)
		.catch(function(error){
			console.log('Error, JSON file "'+week+'.json" is broken.  Reason: ',error);
		});
	};





}]);