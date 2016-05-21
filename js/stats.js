angular.module('StatisticsApp',[])
.controller('you', function($scope){
	$scope.time = [
	{'time':'year',  'f':function(wage,hour){return wage*hours/7*365;} },
	{'time':'month', 'f':function(wage,hour){return wage*hours/7*30; } },
	{'time':'week',  'f':function(wage,hour){return wage*hours;      } },
	{'time':'day',   'f':function(wage,hour){return wage*hours/7;    } },
	];
})
.controller('everyone', function($scope){

})
.controller('quality', function($scope){

})
.controller('website', function($scope){

});