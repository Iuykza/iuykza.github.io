angular.module('panelAdminApp',[])
.controller('panelView',
['$scope', 'ajaxService',
function($scope, ajaxService){

	$('form').removeAttr('action');

	var t = this;
	$scope.userInfos = null;
	$scope.list = {
		userInfos: [],
		schedule: [],
		history: [],
	};

	$scope.edit = [];
	$scope.input = {
		user: {},
		schedule: {},
	};
	$scope.unix = {
		date:     ts => moment(ts).format('MM/DD/YYYY'),
		dateTime: ts => moment(ts).format('MM/DD/YYYY hh:mm a'),
	};
	$scope.User = {
		make: ()=>{
			$scope.defer = true;
			var data = $scope.make;
			ajaxService.user.make(data, function(){
				$scope.defer = false;
				$scope.User.get();
			});
		},
		get: ()=>{
			ajaxService.user.get(callback);

			function callback(res){
				$scope.list.userInfos = res.data;
				$scope.list.userInfos.forEach(parseInfo);
			}
			function parseInfo(u){

				//adds more properties
				u.editmode = false;

				//convert access keys to names
				var tmp = "";
				u.access.forEach(a => tmp += {
					's':'Spectator ',
					'f':'Floor ',
					'm':'Manager ',
					'g':'General Manager',
					'a':'Admin '}[a]
				);
				u.access = tmp;
			}
		},
		delete: (id)=>{
			console.log('deleting '+id);
			ajaxService.user.delete(id, callback);

			function callback(res){
				_.remove($scope.list.userInfos, u => u._id === id);
			}
		},
		update: (id)=>{
			var userInfos = $scope.list.userInfos;
			var i = _.findIndex(userInfos, u => u._id === id);
			userInfos[i].editmode = false;
			
			ajaxService.user.update(id, userInfos[i], callback);
			function callback(res){
				console.log(res);
			}
		},
		fromNameExact: (name)=>{
			console.log(name);
			for(var i=$scope.list.userInfos.length;i--;){
				var info = $scope.list.userInfos[i];
				if(info.name === name){
					return info.uid;
				}
			}
			return -1;
		},
	};
	$scope.schedule = {
		make: (input)=>{
			ajaxService.schedule.make(input, callback);
			function callback(res){
				if(res.error)
					return console.error(res.error);
				console.log(res);
			}
		},
	};
	$scope.history = {
		get: ()=>{
			ajaxService.history.get(callback);
			function callback(res){
				$scope.list.history = res.data;

				//parse data
				for(var i = 0, len = $scope.list.history.length; i < len; i++){
					var array           = $scope.list.history;
					array[i].timePretty = $scope.unix.dateTime(array[i].time);
					array[i].change     = makePretty(array[i].change);
					array[i].undo       = makePretty(array[i].undo);
				}

				//pretty print change/undo JSON objects.
				_.defer(window.prettyPrint);
			}
			function makePretty(obj){
				obj = JSON.stringify(obj, replacer);
				obj = obj.replace(/,/g, ',\n');
				return obj;
			}
			function replacer(key, value){
				if(key[0] === '_') //remove any system vars that begin with underscores.
					return undefined;
				return value;

			}
		},
		comment: (hid, comment)=>{

		},
	};



	$scope.User.get();
	$scope.history.get();
	
	$scope.$watch(scope=>$('#time2').text(),
		(newV,oldV,scope)=>scope.input.schedule.timestart=$('#timestart').val() );

	$scope.$watch(scope=>$('#time2').text(),
		(newV,oldV,scope)=>scope.input.schedule.timeend=$('#timeend').val() );

	$scope.$watch('input.schedule.name',
		(newV,oldV,scope)=>scope.input.schedule.uid = scope.User.fromNameExact(newV));

	$scope.$watch(scope=>$('#schedule-type').val(), (newV, oldV, scope)=>{
		var bind = '';
		$('#schedule-type optgroup').each(function(){
			$group = $(this);
			$find = $('#schedule-type');
			var list = [];
			$group.children().each(function(){
				if( $(this).val() === $find.val() ){
					bind = $group[0].label;
					return;
				}
			})
		});
		scope.input.schedule.access = bind;
	});


	function bugger(n,o,scope){
		console.log('bugger', n, o, $('#timestart').val());
		
	}


	//Initialize timeslider
    $("#slider2").timeslider({
        sliderOptions: {
            range: true, 
            min: fromTime('0900'),  
            max: fromTime('2400'), 
            step:15,
            values: [fromTime('0900'),fromTime('2400')]
        },    
        timeDisplay: '#time2',
        oncuechange: function(v1, v2){
            $('input[name=time-st]').val(v1);
            $('input[name=time-ed]').val(v2);
            $scope.$apply();
        },

    });

    function fromTime(str){
    	while(str.length < 4){
    		str = '0'+str;
    	}
    	var h = Number(str[0]+str[1]);
    	var m = Number(str[2]+str[3]);
    	var mins = h*60+m;
    	//time starts at 6:00PM, we want 12:00AM so f(x) = x - 60*(6+12)
    	return mins - 60*(6+12);
    }

}])
.service('ajaxService', ['$http', function($http){
	//var server = 'http://api.shiftswapsanity.xyz/';
	var server = 'http://localhost:3000/v1/';

	this.user = {
		get: (callback)=>{
			return $http
			.get(server+'users')
			.then(callback)
			.catch( err => console.error('Couldn\'t get users ', err) );
		},
		make: (data, callback)=>{
			return $http
			.post(server+'user', data)
			.then(callback)
			.catch( err => console.error('Couldn\'t make user ', err) );
		},
		delete: (id, callback)=>{
			return $http
			.delete(server+'user/'+JSON.stringify(id))
			.then(callback)
			.catch( err => console.error('Couldn\'t delete user ', err) );
		},
		update: (id, data, callback)=>{
			return $http
			.patch(server+'user/'+JSON.stringify(id), data)
			.then(callback)
			.catch( err => console.error('Couldn\'t patch user ', err) );
		}
	};
	this.history = {
		get: (callback)=>{
			return $http
			.get(server+'history')
			.then(callback)
			.catch( err => console.error('Couldn\'t get history', err) );
		},
		comment: (id, comment, callback)=>{
			return $http
			.patch(server+'history')
			.then(callback)
			.catch( err => console.error('Couldn\'t comment history', err) );
		}
	};
	this.schedule = {
		make: (data, callback)=>{
			if(data.date){
				var data.unix = new Date(data.date);
				data.unix = data.unix.valueOf() - (data.unix.getTimezoneOffset() * 60 * 1000); //offset is in minutes, convert to millisecs.
				data.unix = data.unix / 1000; //convert unixstamp ms to seconds.
				//data.unix = {'unix': data.unix}; //save identifier data.
			}
			return $http
			.post(server+'schedule',data)
			.then(callback)
			.catch( err => console.error('Couldn\'t make schedule ', err) );
		},
	};

}]);