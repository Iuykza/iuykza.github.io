$(()=>{
    var post;
    var $parent = $('#post-parent');

    $.get('https://public-api.wordpress.com/rest/v1.1/sites/cinemark348.wordpress.com/posts/', (data)=>{
        if(data && data.posts){
            for(var i = 0, len = data.posts.length; i < len-1; i++){
                post = data.posts[i];

                console.log(post);

                appendStat({
                    name: 'title',
                    classy: 'title',
                    tag:  'h2',
                });
                appendStat({
                    name: 'by',
                    link: post.author.name,
                    tag: null,
                    format: e=>
                        post.author.first_name != ''? 
                        post.author.last_name  != ''? 
                        post.author.first_name + ' ' + post.author.last_name:
                        post.author.first_name:
                        post.author.name,
                });
                appendStat({
                    name:   'date',
                    tag: null,
                    format: e=>moment(e).format('MMMM Do YYYY, h:mm a'),
                });


                var $post = $('<article></article>').html(post.content);
                var $date = $('<p></p>').text(JSON.stringify(post));
                $parent.append($post);
            }
        }
        function appendStat(obj){
            obj        = obj        || {};
            var $child;
            var name   = obj.name;
            var tag    = obj.tag;
            var classy = obj.classy;
            var format = obj.format || function(a){return a};
            var link   = obj.link   || post[obj.name];

            link = format(link);

            if(!tag){
                tag = 'p';
                $child = $(`<${tag}>   <span>${name}</span>  <span>${link}</span>   </${tag}>`);
                $child.addClass('stat');
            }else{
                $child = $(`<${tag}>${link}</${tag}>`);
            }

            if(classy){
                $child.addClass(classy);
            }


            $parent.append($child);
        }
    });
});