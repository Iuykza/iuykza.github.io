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