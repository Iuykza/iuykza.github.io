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
angular.module('scheduleApp')
.service('dataService', ['$q', 'ajaxService', function($q, ajaxService){
	var t = this;


	this.list           = {
		userInfos: {},   //Type:    Object
		                 //Descr:   User information of each user.
		                 //Depends: Independent.
		                 //Key:     UserID
		                 //         userInfos -> [{userInfo}, {userInfo}, {userInfo}]

		days: {},        //Type:    Array
		                 //Descr:   Schedule data organized by day.  
		                 //Depends: Independent.
		                 //Keys:     UNIX timestamp, UserID
		                 //         days -> day -> [{schedule}, {schedule}, ...]
		                 //              -> day -> [{schedule}, {schedule}, ...]
		                 //              -> ..

		userDatas: [],   //Type:    Array
		                 //Descr:   Schedule data organized by user.
		                 //Depends: Dependent to list.days.
		                 //Keys:     UserID, UNIX timestamp
		                 //         userDatas -> user -> [{schedule}, {schedule}, ..]
		                 //                   -> user -> [{schedule}, {schedule}, ..]
		                 //                   -> ..


		render: [],      //Type:    Array
		                 //Descr:   Used to determine whether or not a users exist
		                 //           within the current displayed schedule.
		                 //Depends: Dependent to list.days.
		                 //Key:     (None)
		                 //         render -> [{user}, {user}, {user}]

		fuzzy: {},      //Type:    Object
		                 //Descr:   Fuzzyset containing matches for each user.

	};
	
	this.currentUser = '10080';
	this.current = {
		data: []
	};
	this.today       = 1460696400;
	this.friday      = getWeekBegin(this.today);

	this.unix = {
		dayName: (unix, extraDays) => unixStd(unix, extraDays).format("ddd"),
		date:    (unix, extraDays) => unixStd(unix, extraDays).format("MM/DD"),
		add:     (unix, extraDays) => unixStd(unix, extraDays).unix(),
	};

	this.ready = {
		userInfos: $q.defer(),
		days:      $q.defer(),
	}


	ajaxService.getUsers(function(res){
		t.list.userInfos = res.data;
		t.list.fuzzy = makeFuzzy(t.list.userInfos);
		t.ready.userInfos.resolve(res);
	});
	ajaxService.getWeek(t.friday, function(res){
		t.list.days = res.data;
		t.current.data = t.list.days[t.today];
		t.ready.days.resolve(res);
	});








	
	var list = this.list;
	this.user = {
		name: (userid => (list.userInfos[userid] || {name: ''}).name),

		IDfromName: (name => list.fuzzy.get(name)[0][1]),

		role: function(userid){
			var r = (list.userInfos[userid] || {role: []}).role;
			return (r.indexOf('concession') != -1)? 'user-con' :
			       (r.indexOf('box'       ) != -1)? 'user-box' :
			       (r.indexOf('usher'     ) != -1)? 'usher-usher' : '';
		},
		
		start: function(userid){
			var r = (list.userInfos[userid] || {start: ''}).start;
			if(r === '')
				return;
			
			var year = 31556926*1000;
			r = r * 1000;

			return (Date.now() - r >= year*5)?'user-year-5':
			       (Date.now() - r >= year*3)?'user-year-3':
			       (Date.now() - r >= year*1)?'user-year-1':'';
		}
	}

	this.formatTime = formatTime;

}]);









function unixStd(unix, extraDays){
	return moment(unix*1000).add(extraDays || 0, 'days');
}

function formatTime(t){
	t = t || {};
	var timeArray      = t.time     || '';
	var enableDetail   = t.detail   || false;
	var enableMilitary = t.military || false;

	if(typeof timeArray === 'undefined' || timeArray === '')
		return '';

	var first = timeArray[0];
	var last =  timeArray[timeArray.length-1];


	if(!enableDetail){
		//minimal, Military time
		if(enableMilitary){
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
				(i>0?                    //Excluding the first,
					(i%2==0?', ':' to ') //Separate durations on their own lines, add 'time to time' between both.
				:
					('')
				)+(enableMilitary?       //Use military format or standard.
					hour24(timeArray[i])
				:
					hour12(timeArray[i])
				);

		return formattedLong+'</div>';
	}

	function hour12(str){
		str = str.toString();
		while(str.length < 4)
			str = '0'+str;

		var hour = str[0]+str[1];
		var min  = str[2]+str[3];
		var sign = ['am','pm'][(hour >= 12 && hour < 24) | 0];

		if(hour == 12 || hour == 24) //implicit typecast
			hour = 12;
		else
			hour = hour % 12;

		return `${hour}:${min}${sign}`;
	}
	function hour24(str){
		str = str.toString();
		while(str.length < 4)
			str = '0'+str;
		return str;

	}




}


/*** Function Helpers ***/

function getWeekBegin(str){

		return moment(str*1000).day(5).unix();
}

function makeFuzzy(from){
	var tmp = [];

	for(var u in from)
		tmp.push(from[u].name);

	return FuzzySet(tmp);
}

angular.module('scheduleApp')
.directive('tabledom', [function(){
	return {
		templateUrl: 'template/table.html',
		controller: 'scheduleMain',
		replace: true
	};
}]);

angular.module('scheduleApp')
.directive('welcomeinfo', [function(){
	return {
		templateUrl: 'template/welcomeinfo.html',
		controller: 'controlwelcome',
		replace: true
	};
}]);

angular.module('scheduleApp')
.controller('scheduleMain', ['$scope', '$q', '$route', 'ajaxService', 'dataService',
function($scope, $q, $route, ajaxService, dataService){

	$scope.unix       = dataService.unix;
	$scope.formatTime = dataService.formatTime;
	$scope.user       = dataService.user;
	$scope.list       = dataService.list;
	$scope.friday     = dataService.friday;
	$scope.today      = dataService.today;
	$scope.timespan   = 2;

	$scope.refresh = function(){$route.reload();console.log('reloading!');};
	$scope.military = false;
	$scope.militaryTimeEnable = false;


	var readyday  = dataService.ready.days.promise,
	    readyinfo = dataService.ready.userInfos.promise;

	$q.when(readyday, readyinfo).then(function(){


		render = [];
		(function(){ //"this" is now scoped as $scope.list
			var render = this.render;
			var userDatas  = this.userDatas;

			//Reject if list hasn't finished loading.


			//Reject if list doesn't have data for this week.
			var secsInDay = 60 * 60 * 24;
			var friday = $scope.friday;
			for(var i = 0; i <=6; i++){
				if(typeof this.days[ friday+secsInDay*i ] === 'undefined'){
					console.error('Rejected.  Missing data for the week.');
					return;
				}
			}
			
			

			//1 INPUT
				//days object -> single day -> schedule data
				for(var i in this.days){
					var day = this.days[i];

					for(var data of day){

						//1.1. Get all users

						//add this user if he isn't there.
						if(render.indexOf(data.userid) === -1){
							render.push(data.userid);
						}

						if(typeof userDatas[data.userid] === 'undefined'){
							userDatas[data.userid] = {};
						}


						//1.2  Get user data
						userDatas[data.userid][i] = data;

					}
				}

				//2 SORT
				$scope.list.render = _.sortBy(render, z => z);

		}).call($scope.list);
		console.log($scope.list.render);
	});



	$scope.data = {
		schedule: (userid, day, offset) => $scope.formatTime({
			time:     $scope.data.data(userid, day, offset).time,
			detail:   $scope.detailEnable,
			military: $scope.militaryTimeEnable
		}),
		isMorning: (userid, day, offset) => $scope.data.data(userid, day, offset).time[0] < 1400,
		detail:   (userid, day, offset) =>  $scope.data.data(userid, day, offset).detail,
		class: function(userid, day, offset){
			var detail = $scope.data.detail(userid, day, offset);
			if(detail.toLowerCase().includes('concession')) return 'con';
			if(detail.toLowerCase().includes('usher'))      return 'ush';
			if(detail.toLowerCase().includes('box'))        return 'box';
			if(detail == '')                                return '';
			return 'mis';
		},
		data: function(userid, day, offset){
			if(typeof offset != 'undefined')
				day = $scope.unix.add(day, offset);
			var data = $scope.list.userDatas[userid][day];

			if(typeof data === 'undefined')
				return {id:'',  userid:'',  detail:'',  time:''};

			return data;
		}
	};









}]);



angular.module('scheduleApp')
.controller('controlwelcome', ['dataService', 'ajaxService', '$scope', '$q', '$timeout',
function(dataService, ajaxService, $scope, $q, $timeout){

	//Loader screen
	$scope.progress = true;
	$scope.timeUntilShift = '';
	$scope.shiftToday = {};
	$scope.shiftTomorrow = '';
	$scope.breaks = '';
	$scope.unix = dataService.unix;
	$scope.untilStep = 1;
	$scope.untilClock = '';


	
	var today = dataService.today;
	var l = dataService.list;

	//Finished loading
	$q.all([dataService.ready.days.promise, dataService.ready.userInfos.promise]).then(function(){

		console.log(l.days[today]);

		for(i in l.days[today]){
			var obj = l.days[today][i];
			if(obj.userid == dataService.currentUser){
				console.log('got!', obj);
				$scope.shiftToday = dataService.formatTime({time:obj.time});

				var t = moment(today*1000);

				for(stop in obj.time){
					if(moment().isBefore(now())){

					}
				}
				var shift = gToday(obj.time[0]);
				console.log(now().format('YYYY MMM Do [at] h:mm:ss a'));
				$scope.untilClock = shift.to(now());//
				
				break;
			}
		}


		$scope.name = dataService.user.name(dataService.currentUser).split(' ')[1];


		$scope.progress = false;
	});




	function now(){
		var actual = moment();
		var g = {
			h: actual.hour(),
			m: actual.minute(),
			s: actual.second(),
			ms: actual.millisecond(),
		};
		return moment(today*1000)
		.add(g.h, 'h')
		.add(g.m, 'm')
		.add(g.s, 's')
		.add(g.ms, 'ms');
	}
	function gToday(str){

		str = str.toString();
		if(str.length < 4)
			str = '0'+str;

		var g = {
			h: str[0]+str[1],
			m: str[2]+str[3],
		};

		console.log('adding', g.h, g.m);
		return moment(today*1000)
		.add(g.h, 'h')
		.add(g.m, 'm');
	}

}]);



