(function(){

var server, path, method;
var $response = $('#response');


function $val(selector){
    return $('#'+selector).val();
}

$('#send').click(function(e){
    e.preventDefault();

    var server = $val('address');
    var path   = $val('path');
    var method = $val('method');
    var body = {jquery: JSON.parse($val('body') || "\"\"")};

    var url = server+path;
    var jax = $.ajax({
        url: url,
        method: method,
        data: body,
    });

    jax.done(function(xhr, status){
        if(status != 'success'){
            $response.val('status');
        }else{
            $response.val(JSON.stringify(xhr));
        }
    });

    jax.error(function(xhr, status, error){
        console.error('status',error);
    });
});



})();