angular.module('scheduleApp')
.service('ajaxService', ['$http', function($http){
	var server = 'http://api.shiftswapsanity.xyz/v1/';
	// var server = 'http://localhost:3000/v1/';

	this.getUsers = function(callback){
		return $http.get(server+'users')
		.then(callback)
		.catch(err => console.log('Error in getUsers ',err) );
	};

	this.getWeek = function(access, day, callback){
		access = String( access || 'floor'                                );
		day    = String( day    || new Date().toISOString().substr(0, 10) );

		console.log(day, server+'schedule/access/'+access+'/day/'+day);
		$http.get(server+'schedule/access/'+access+'/day/'+day)
		.then(callback)
		.catch(err => console.log('Error in getWeek ',err) );
	};





}]);
angular.module('scheduleApp')
.service('dataService', ['$q', 'ajaxService', function($q, ajaxService){
	var t = this;

var that = this;

	this.list = {
		userInfos: {},   //Type:    Object
		                 //Descr:   User information of each user.
		                 //Depends: Independent.
		                 //Key:     UserID
		                 //         userInfos -> [{userInfo}, {userInfo}, {userInfo}]

		days: [],        //Type:    Array of type object
		                 //Descr:   Schedule data organized by day.  
		                 //Depends: Independent.
		                 //Keys:     UNIX timestamp, UserID
		                 //         days(array) -> day -> [{schedule}, {schedule}, ...]
		                 //                     -> day -> [{schedule}, {schedule}, ...]
		                 //                     -> ..

		userDatas: [],   //Type:    Array of type object
		                 //Descr:   Schedule data organized by user.  Duplicated from days array.
		                 //Depends: Dependent to list.days.
		                 //Keys:     UserID, UNIX timestamp
		                 //         userDatas(array) -> user(obj) -> user.data(array) [{schedule}, {schedule}, ..]
		                 //                          -> user(obj) -> user.data(array) [{schedule}, {schedule}, ..]
		                 //                          -> ..

		fuzzy: {},      //Type:    Object
		                 //Descr:   Fuzzyset containing matches for each user.

	};
	
	this.currentUser = '10080';
	this.today       = 1480572000;
	this.friday      = 1480572000;//getWeekBegin(this.today);

	this.unix = {
		dayName: (unix, extraDays) => unixStd(unix, extraDays).format("ddd"),
		date:    (unix, extraDays) => unixStd(unix, extraDays).format("MM/DD"),
		add:     (unix, extraDays) => unixStd(unix, extraDays).unix(),
	};

	this.ready = {
		userInfos: $q.defer(),
		days:      $q.defer(),
	}

	this.tmp = {};

	





	
	var list = this.list;
	this.user = {
		name: (userid => (list.userInfos[userid] || {name: ''}).name),
		/*name: function(matchid){
			return list.userInfos.find(u => u.uid === matchid) || {name: ''};
		},*/

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
		},
		getInfoIndex: (uid)=>{
			//Finds a user's index based upon uid.
			//Returns index within userInfos.

			var userInfos = t.list.userInfos;
			for(var i = userInfos.length; i--;){
				var userInfo = userInfos[i];
				if(userInfo.uid === uid){
					return i;
				}
			}//end for
			return -1;
		},
		getDataIndex: (uid)=>{
			//Finds a user's index based upon uid.
			//Returns index within userDatas.

			var userDatas = t.list.userDatas;
			for(var i = userDatas.length; i--;){
				var userData = userDatas[i];
				if(userData.uid === uid){
					return i;
				}
			}//end for
			return -1;
		},
	};
	this.schedule = {
		getDay: (date)=>{
			//Loops through the days array until it finds a day that matches the given date.
			//Returns a day object

			//Input:
			//date = string value of a unix timestamp

			var found = null;
			for(var i = 0, len = list.days; i < len; i++){
				var day = list.days[i];
				if(day.date === date){
					found = day;
					break;
				}
			}

			if(found){
				return found;
			}
			else{
				return update(date);
			}
		},
		getDayIndex: (date, n, indexStart)=>{
			//Loops through the days array until it finds a day that matches the given date.
			//Returns an index.

			//Inputs:
			//date = a 
			//indexStart (optional) = the index from the day array to begin searching.

			date = t.unix.add(date, n);

			var found = null;
			for(var i = indexStart || 0, len = list.days; i < len; i++){
				var day = list.days[i];
				if(day.date === date){
					found = i;
					break;
				}
			}

			if(found){
				return i;
			}
			else{
				return update(date);
			}
		},
		getUserShift: (date, n, uid)=>{
			//Finds a user's shift from within a day.
			//Returns entire shift object.

			//Inputs:
			//date = ISO string, unix timestamp.
			//uid = the uid of the user to find.

			date = t.unix.add(date, n);

			var uIndex = t.user.getDataIndex(uid);
			if(uIndex === -1)
				return false;

			if(!t.list.userDatas[uIndex])
				return false;

			var uDatas = t.list.userDatas[uIndex].data;
			for(var i=uDatas.length;i--;){
				var uData = uDatas[i];
				//LEAK: unix/1000 could break 100+ years from now.
				if(uData.date === date || uData.date.unix === date || uData.date.unix/1000 === date || uData.date.iso === date){
					t.tmp = uData;
					return uData;
				}
			}
			return false;


		},
		usersActiveWeek: (date, days)=>{
			//Finds all users that are "active" for a particular schedule
			//returns integer array of UIDs

			//inputs:
			//date = a unix timestamp to begin the search.
			//days = number of days to consecutively search.

			var usersOfWeek = [];
			
			//days => day => shifts => shift.user
			for(var i = 0; i < days; i++){ //Look at each day
				var day = list.days[date];
				for(var j = 0, jlen = day.length; j < jlen; j++){ //Look at shifts of each day
					var shift = day[j];
					//Look at user that belongs to this shift
					//Save this user to the list
					usersMatchWeek.push(shift.uid);

				}
			}

			return usersOfWeek;
		},
		update: ()=>{


		},
		shiftMorningOrAfternoonOrBoth: ()=>{
			const MORNING_END = 1700;
			const AFTERNOON_START = 1400;

		},
		lastTimecardApproval: (date, uid)=>{
			//finds the last possible day a user can approve their timecard.

			//1. Look at Thursday.
			//0=sun, 1=mon, 2=tue, 3=wed, 4=thu, 5=fri, 6=sat
			const WEEK_ENDING = 4;
			var count = 0;
			do{

				//2. Is the user working this day?
				var day = this.schedule.getUserShift(date);
				var isWorking = typeof day === 'object';
				
				//2.1.
				if(isWorking){
				//   If Yes.
				//	   This is the day we want.
				//	   End.
					return date;
				}
				else{
				//   If No.
				//	   Look at the day before this one.
				//	   Disallow stepping more than 7 previous days.
				//	      This prevents an infinite loop.
				//   Goto 2.
				}
				count++;
			}while(count < 7);

			//3. Reaching this point means the user does not exist within the schedule


		},



	};

	this.formatTime = formatTime;


}]);






function unixStd(unix, extraDays){

	return moment(unix*1000).add(extraDays || 0, 'days');
}

function formatTime(t, military){

	t = t || {};
	var timeArray      = t.time     || '';
	var enableDetail   = t.detail   || false;
	var enableMilitary = military;



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
		var formattedLong='';

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
		return formattedLong;
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
	$scope.ched       = dataService.schedule;

	$scope.refresh = function(){$route.reload();console.log('reloading!');};
	$scope.militaryTimeEnable = dataService.militaryTimeEnable;

	$scope.tmp = dataService.tmp;



	/*** Initial load and entry point ***/

	var list  = $scope.list;
	var ready = dataService.ready;
	
	ajaxService.getUsers(function(res){
		list.userInfos = res.data;
		list.fuzzy = makeFuzzy(list.userInfos);
		ready.userInfos.resolve(res);
		console.log('getusers finished');
	});
	console.log($scope.friday, 'friday');
	ajaxService.getWeek('floor', $scope.friday, function(res){
		dataService.ready.days.resolve(res);
		rend($scope.today);
		console.log('week finished');
	});

	var readyday  = ready.days.promise,
	    readyinfo = ready.userInfos.promise;
	
	$q.when(readyday, readyinfo).then(function(){

	});
	

	/**************************                    **************************/
	/*************************   Function Methods   *************************/
	/**************************                    **************************/

	function rend(timeStart){
		console.log('rend started');
		//not rendered?
		if(!$scope.list.render || !$scope.list.render[timeStart]){
			ready.days = $q.defer();

			//get data if necessary & render it

			$q.when(readyday).then(callbackGetData);
		}

		function callbackGetData(res){
			//empty list or needed days missing
			if(!$scope.list.days || !$scope.list.days[timeStart]){
				//go get them, and build it
				console.log('start');
				ajaxService.getWeek('floor', timeStart, callbackParse); 
			}else{
				//just build it
				callbackBuild();
			}
		}
		function callbackParse(res){

			if(!res){
				return console.error('Response non-existent.');
			}
			if(res.error){
				return console.error(res.error);
			}

			//var data = res.data;
			var days = dataService.list.days;
			var userDatas = dataService.list.userDatas;
			//Response sends back a list of user schedule data.
			//Go through list and compare it to ours.

			for(var i=res.data.length; i--;){
				console.log('days',days);

				var newData = res.data[i];
				var exist = userDataExists(newData.uid);
				var existIndex = exist;

				//Don't have user in list, create new and append.
				if(exist === -1){
					userDatas.push({
						uid: newData.uid,
						data: [newData]
					});
				}
				else{
					//Append data to existing.
					userDatas[existIndex].data.push(newData);
				}


				existIndex = exist = dayExists(newData.date.unix);
				console.log(exist, existIndex);
				if(exist === -1){
					days.push({
						date: newData.date,
						data: [newData]
					});
				}
				else{
					days[existIndex].data.push(newData);
				}


					
			}//end for
			function userDataExists(uid){
				var userDatas = dataService.list.userDatas;
				for(var i=userDatas.length;i--;){
					if(userDatas[i].uid === uid)
						return i;
				}
				return -1;
			}
			function dayExists(unix){
				var days = dataService.list.days;
				for(var i=days.length;i--;){
					if(days[i].date.unix === unix){
						return i;
					}
				}
				return -1;
			}

			callbackBuild();
		}//end function parse
		function callbackBuild(res){
			//$scope.list.render[timeStart];
			console.log('data finished');

		}
	}//end function rend





	/**************************                    **************************/
	/*************************   Function Methods   *************************/
	/**************************                    **************************/

	$scope.find = {
		schedule: (userid, day, offset) => $scope.formatTime({
			time:     $scope.data.data(userid, day, offset).time,
			detail:   $scope.detailEnable,
			military: $scope.militaryTimeEnable
		}),
		isMorning: (userid, day, offset) => $scope.data.data(userid, day, offset).time[0] < 1400,
		detail:    (userid, day, offset) => $scope.data.data(userid, day, offset).detail,
		class: function(userid, day, offset){
			var detail = $scope.data.detail(userid, day, offset);
			if(detail.toLowerCase().includes('concession')) return 'con';
			if(detail.toLowerCase().includes('usher'))      return 'ush';
			if(detail.toLowerCase().includes('box'))        return 'box';
			if(detail == '')                                return '';
			return 'mis';
		},
		data: function(uid, day, offset){
			var userDatas = dataService.list.userDatas;
			var index = userDataExists(uid);
			//day = day + offset
			
			if(index != -1){
				return userDatas[index].data;
			}

			function userDataExists(uid){
				for(var i=userDatas.length;i--;){
					if(userDatas[i].uid === uid)
						return i;
				}
				return -1;
			}
		}
	};









}]);


		// (function(){ //"this" is now scoped as $scope.list
		// 	var render = this.render;
		// 	var userDatas  = this.userDatas;

		// 	//Reject if list hasn't finished loading.


		// 	//Reject if list doesn't have data for this week.
		// 	var secsInDay = 60 * 60 * 24;
		// 	var friday = $scope.friday;
		// 	for(var i = 0; i <=6; i++){
		// 		if(typeof this.days[ friday+secsInDay*i ] === 'undefined'){
		// 			console.error('Rejected.  Missing data for the week.');
		// 			return;
		// 		}
		// 	}
			
			

		// 	//1 INPUT
		// 		//days object -> single day -> schedule data
		// 		for(var i in this.days){
		// 			var day = this.days[i];

		// 			for(var data of day){

		// 				//1.1. Get all users

		// 				//add this user if he isn't there.
		// 				if(render.indexOf(data.userid) === -1){
		// 					render.push(data.userid);
		// 				}

		// 				if(typeof userDatas[data.userid] === 'undefined'){
		// 					userDatas[data.userid] = {};
		// 				}


		// 				//1.2  Get user data
		// 				userDatas[data.userid][i] = data;

		// 			}//end for data
		// 		}//end for days

		// 		//2 SORT
		// 		$scope.list.render = _.sortBy(render, z => z);

		// }).call($scope.list);
angular.module('scheduleApp')
.controller('controlwelcome', ['dataService', 'ajaxService', '$scope', '$q', '$timeout', '$interval',
function(dataService, ajaxService, $scope, $q, $timeout, $interval){

	//Loader screen
	$scope.progress = true;
	$scope.timeUntilShift = '';
	$scope.shiftToday = {};
	$scope.shiftTomorrow = '';
	$scope.breaks = [];
	$scope.unix = dataService.unix;

	$scope.untilStep = 1;
	$scope.untilClock = {
		str: '',
		detail: '',
	};

	var t = this;
	t.stopGaps = [];

	
	$interval(function(){
		t.currentTime = now().format('hh:mm:ss a');
	}, 1000);

	$scope.$watch(
		(scope) => t.currentTime,
		function(newV, oldV){
			//update currentTime ticker
			$scope.currentTime = now().format('hh:mm a');

			//Update the stopGap ticker
			$q.all([d.ready.days.promise, d.ready.userInfos.promise]).then(function(){

				//Find where the current time lands in the stop gaps.
				var gap = 0;
				while(t.stopGaps[gap].m.isBefore(now())){
					gap++;
				}

				//Check if we're waiting for the shift to start, end, break...
				$scope.untilStep =
					gap===0                  ? 'start':
					gap===t.stopGaps.length-1? 'end':
					gap===t.stopGaps.length  ? 'afterhour':
				    gap%2===1                ? 'br-start':
				    gap%2===0                ? 'br-end':
				    '';

				//Output the difference between now and the stop gap.
				var untilTotal = -now().diff(t.stopGaps[gap].m, 'seconds');
				var clock = {
					s: padLeft(          (untilTotal     )%60, 2),
					m: padLeft(Math.floor(untilTotal/60  )%60, 2),
					h: padLeft(Math.floor(untilTotal/3600)%24, 2),
				};
				$scope.untilClock.str =    clock.h + ':'        + clock.m + ':'          + clock.s;
				$scope.untilClock.detail = clock.h + ' hours, ' + clock.m + ' minutes, ' + clock.s + ' seconds.';


				function padLeft(nr, n, str){
    				return Array(n-String(nr).length+1).join(str||'0')+nr;
				}
			});
		}
	);


	//Finished loading
	var d     = dataService;
	var today = dataService.today;
	var l     = dataService.list;
	$q.all([d.ready.days.promise, d.ready.userInfos.promise]).then(function(){
		console.log('d',d);
		console.log('today',today);

		var stopGaps = t.stopGaps;

		try{
			//Find user's time in list.
			var time;
			for(i in l.days[today]){
				var obj = l.days[today][i];
				if(obj.userid == d.currentUser){
					time = obj.time;
					break;
				}//if
			}//for


			//Get shift "you work" data.
			var youWork = {};
			youWork.start = todayFromClock(time[0]                ).format('hh:mm a');
			youWork.end   = todayFromClock(time[time.length-1]).format('hh:mm a');
			$scope.shiftToday = youWork.start + ' to ' + youWork.end;//d.formatTime({time:time});


			//Convert stop gaps to data.
			for(s in time){
				var stopGap  = {};
				stopGap.str  = time[s];
				stopGap.data = timestringToData(stopGap.str);
				stopGap.m    = now()
					.hours(stopGap.data.h)
					.minutes(stopGap.data.m)
					.seconds(0);

				//save gaps
				stopGaps.push(stopGap);

				//save breaks
				if(stopGaps.length%2===0)
					$scope.breaks.push(stopGap.m.format('hh:mm a'));
			}//for stopGap


			//last break is actually a clock out.
			$scope.breaks.pop();


		}//try
		catch(e){
			console.error('Error: couldn\'t read from dataService.list.\n'+
			              'Ajax probably failed to load.\n'+
			              'Or server could have sent a corrupted response.\n'
			);
		}

		try{
			$scope.name = d.user.name(d.currentUser).split(' ')[1];
		}
		catch(e){
			console.error('Error: couldn\'t read from dataService.user.\n'+
		                  'Ajax probably failed to load.\n'+
		                  'Or server could have sent a corrupted response.\n'
			);
		}

		$scope.progress = false; //reveal the welcomeinfo screen.
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
	function todayFromClock(str){
		var g = timestringToData(str);

		console.log('adding', g.h, g.m);
		return moment(today*1000)
			.hours(g.h)
			.minutes(g.m);
	}
	function timestringToData(str){
		str = str.toString();
		if(str.length < 4)
			str = '0'+str;

		return{
			h: str[0]+str[1],
			m: str[2]+str[3],
		};
		
	}
	function isWorkDay(shift){
		console.log('shift',shift);
		return true;
	}
	function generalForm(){
		return 'YYYY MMM Do [at] h:mm:ss a';
	}
}]);



