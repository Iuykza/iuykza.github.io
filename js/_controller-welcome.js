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



