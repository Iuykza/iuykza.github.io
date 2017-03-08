(function($) {  
    $.widget("ui.timeslider", {
        getTime: function(value){   
            var time = null,
                from = new Date(value * 60 * 1000),
                minutes = from.getMinutes(),
                hours = from.getHours();
            
            if (hours === 0) {
                hours = 12;
            }
        
            if (hours == 12 && value > 719) {
                hours = 12;
                time = "AM";
            }
            else if (hours > 12) {
                hours = hours - 12;
                time = "PM";
            }
            else if (hours == 12){
                time = "PM";
            }
            else {
                time = "AM";   
            }
        
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
        
            return hours + ":" + minutes + " " + time;
        },
        _slideTime: function (event, ui){
            var that = $(this),
                el = event? event.target: {oncuechange: a=>a},
                startTime = null,
                endTime = null;


            if(that.slider( "option", "range" ) && ui){
                startTime = that.timeslider('getTime',ui.values[0]);
                endTime = that.timeslider('getTime', ui.values[1]);

                el.oncuechange(startTime,endTime);
                that.timeslider('option', 'timeDisplay').text(startTime + ' - ' + endTime);
            }

           
        },
        _checkMax: function(event, ui) {
            var that = $(this);
        
            if(that.slider( "option", "range" )){
                var div = that.find('div'),
                    size = that.slider("values", 1) - that.slider("values", 0);
                if( size >= 1435) {
		            div.addClass("ui-state-error");
                    that.timeslider('option', 'submitButton').attr("disabled","disabled").addClass("ui-state-disabled");
                    that.timeslider('option', 'errorMessage').text("Cannot be more than 24 hours");
	            }
		        else {	
                    div.removeClass("ui-state-error");
                    that.timeslider('option', 'submitButton').attr("disabled",null).removeClass("ui-state-disabled");
                    that.timeslider('option', 'errorMessage').text("");
                } 
            }
        },
        options: {
            sliderOptions: {},
            errorMessage: null,
            timeDisplay: null,
            submitButton: null,
            clickSubmit: null,
            oncuechange: null,
            
        },
        _create: function() {
            var that = this,
                o = that.options,
                el = that.element;
                

                el[0].oncuechange = o.oncuechange; //HACK: can't access values before object is created, instead save to DOM.


                o.sliderOptions.slide  = that._slideTime;
                o.sliderOptions.change = that._checkMax;
                o.sliderOptions.stop   = that._slideTime;
                o.sliderOptions.aaaaaasdfjkl = o.change;
                el.slider(o.sliderOptions);
                
                o.errorMessage = $(o.errorMessage);
                o.timeDisplay = $(o.timeDisplay);
                o.submitButton = $(o.submitButton).click(o.clickSubmit);
                
                
                that._slideTime.call(el);
        },
        _destroy: function() {
            this.element.remove();
        }
    });
})(jQuery);
 