
const ip = "ip";
const wss = new WebSocket("ws://172.19.0.2:50001")

$('document').ready(function(){
    $.ajax({
        type: 'GET',
        url: '../inc/recupere_ip.php',
        dataType: 'html',
        timeout: 500,
        success: function(reponse){
            json(reponse);
        }

    });
});

async function json(ip){
    setInterval(() => {
        
        wss.onopen = function (event) {      
            wss.send(JSON.stringify({ //send a JSON through websocket that contains a list of students and the app they're in
                type:"type_eleve",
                name:"digimindmap",
                data:{id:ip, name:""}
            },
            {
                type:"integration",
                name:"digimindmap",
                logo:"https://pouet.chapril.org/system/accounts/avatars/000/096/847/original/841401129f94028b.png",
            }
            ));
        }
    }, 10000);
}


