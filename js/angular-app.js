angular.module('scheduleApp')
.service('dataService', function($http){
	this.getUsers = function(callback){
		$http.get('mock/users.json')
		.then(callback)
		.catch(function(error){
			console.log('Error, JSON file "users.json" is broken.  Reason: ',error);
		});
	}


	this.getWeek = function(week, callback){
		console.log('GET mock/employee/'+week+'.json');
		$http.get('mock/employee/'+week+'.json')
		.then(callback)
		.catch(function(error){
			console.log('Error, JSON file "'+week+'.json" is broken.  Reason: ',error);
		});
	}





});
angular.module('scheduleApp')
.directive('tabledom', function(){
	return {
		templateUrl: 'template/table.html',
		controller: 'scheduleMain',
		replace: true
	};
});
angular.module('scheduleApp')
.controller('scheduleMain', function($scope, dataService){


	$scope.today              = 1460782800;
	$scope.friday             = function(){return getWeekBegin($scope.today)};

	$scope.militaryTimeEnable = false;
	$scope.detailEnable       = false;
	
	$scope.list           = {
		days: null,
		users: null,
		render: null,
	};
	$scope.fuzzy = null;
	$scope.user = null;

	dataService.getUsers(function(res){
		$scope.list.users = res.data;

		var fuzzyRay = [];
		for(var u of $scope.list.users){
			fuzzyRay.push(u.name);
		}

		$scope.fuzzy = FuzzySet(fuzzyRay);
	});


	dataService.getWeek($scope.friday(), function(res){
		


		//merge res.data onto listDays.
		$scope.list.days = res.data;
	});


	$scope.renderWeek = function(){
		if($scope.list.users == null || $scope.list.days == null)
			return;
		$scope.list.render = {
			user: [],
			data: [],
		};

		//1. Input
		(function input(){
			//1.1. Get all users
			for(var day of $scope.list.days){
				for(var data of day){
					$scope.list.render.user.push(data.userid);
				}
			}
			//2.2. Get current week

		})();
		//2. Match users to week
		(function match(){
			$scope.list.render = [];


		})();
		//3. Processing
			//3.1. Users from this week
			//3.2. Sort alphabetically
		//4. Output
	}




	$scope.formatTime = function(timeArray){
		var first = timeArray[0];
		var last =  timeArray[timeArray.length-1];


		if(!$scope.detailEnable){
			//minimal, Military time
			if($scope.militaryTimeEnable){
				first = hour24(first);
				last  = hour24(last);

			//minimal, AM/PM time
			}else{
				first = hour12(first);
				last  = hour12(last);
			}
			return `${first} to ${last}`;

		}else{
			var formattedLong = '<div>';

			//Full detail
			for(var i = 0; i<timeArray.length; i++)
				formattedLong +=
					(i>0?                   //Excluding the first,
						(i%2==0?', ':' to ')//Separate durations on their own lines, add 'time to time' between both.
					:
						('')
					)+($scope.militaryTimeEnable?  //Use military format or standard.
						hour24(timeArray[i])
					:
						hour12(timeArray[i])
					);

			return formattedLong+'</div>';
		}

		



		function hour12(str){
			var hour = str[0]+str[1];
			var min  = str[2]+str[3];
			var sign = ['am','pm'][hour >= 12 | 0];
			hour = String(hour==12? 12: hour%12);
			return `${hour}:${min}${sign}`;
		}
		function hour24(str){
			return str;
		}
	}


	$scope.formatBreak = function(timeArray){

	}


	$scope.getClass = function(str){
		if(str.toLowerCase().includes('concession')) return 'con';
		if(str.toLowerCase().includes('usher'))      return 'ush';
		if(str.toLowerCase().includes('box'))        return 'box';
		return 'mis';
	}



	$scope.fromID = function(find){
		//Gets a user's name from their ID
		//where find = an integer representing the ID of an employee inside listUser
		var list = $scope.listUser;

		for(var i in list){
			if(find == list[i].id)
				return list[i].name;
		}

		return 'User ID: '+find;
	};

	$scope.fromName = function(find){
		var full = $scope.fuzzy.get(find)[0][1];
		console.log(full);
		for(var i in list){
			if(full == list[i].name)
				return list[i].id;
		}
	};




















	/*** Function Helpers ***/

	function getWeekBegin(str){
			return moment(str*1000).day(5).unix();
	}



});





