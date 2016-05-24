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


