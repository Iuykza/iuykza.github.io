
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
