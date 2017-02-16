var socket = null;

$('document').ready(function(){
    //socket = io.connect('https://localhost:8080');
    socket = io.connect('https://recording.trainybee.com:80');
socket.on("connect", function (id) {

        var obj = {};
        obj['sdf'] ='sdf';
        socket.emit('getId',obj);
});
socket.on("onId", function (id) {
           socketId  = id;
           var userData         = {};
            userData.name       = user_name;
            userData.room       = roomname;
            userData.cam        = '0';
            userData.mic        = '0';
            userData.chat       = '1';
            userData.doc        = '1';
            socket.emit('addUser',userData);
            var obj = {};
        });
socket.on('onDisconnectUser', function (data) {
    //alert(data);
   //$('#'+data).remove();
});
socket.on('onUserList', function (data) {
    //alert(JSON.stringify(data));
        var userListHtml   = '';
        data               = data[roomname];
        var count = 0;
    for (var key in data) {
        if(data[key].id != socketId){
            count++;
            var camChk = '';
            var micChk = '';
            var chatChk = '';
            var docChk = '';
            if(data[key].cam == '1'){
                camChk = 'checked';
            }
            if(data[key].mic == '1'){
                micChk = 'checked';
            }
            if(data[key].chat == '1'){
                chatChk = 'checked';
            }
            if(data[key].doc == '1'){
                docChk = 'checked';
            }
            userListHtml += '<div class="adchkbox user-list-box">';
            userListHtml += '<input '+docChk+' onChange="adminControl(\''+data[key].id+'\',\'doc\')" id="'+data[key].id+'_doc" type="checkbox" class="pull-right" style="margin-right:7px;">';
            userListHtml += '<input '+chatChk+' onChange="adminControl(\''+data[key].id+'\',\'chat\')" id="'+data[key].id+'_chat" type="checkbox" class="pull-right chck-gap" style="margin-right:13px;">';
            if(camAllow == 1){
              userListHtml += '<input '+camChk+' onChange="adminControl(\''+data[key].id+'\',\'cam\')" id="'+data[key].id+'_cam" type="checkbox" class="pull-right chck-gap" style="margin-right:13px;">';
            }else{
              userListHtml += '<input disabled onChange="adminControl(\''+data[key].id+'\',\'cam\')" id="'+data[key].id+'_cam" type="checkbox" class="pull-right chck-gap" style="margin-right:13px;">';
          }
            userListHtml += '<input '+micChk+' onChange="adminControl(\''+data[key].id+'\',\'mic\')"  id="'+data[key].id+'_mic"  type="checkbox" class="pull-right chck-gap" style="margin-right:6px;">';
            userListHtml += '<span style="margin-left:15px;">'+data[key].name+'</span>';
            userListHtml += ' </div>';
        }
       }
       $('#ucount').html(count);
  if(count>0){
     $('#userList').html(userListHtml);
  }else{
    $('#userList').html('<h4 class="no-part">No Users Joined yet</h4>');
  }

});
socket.on('onReceivesendtoAll', function (obj){
           if(obj.room != roomname){
                return;
           }
           var method = obj.method;
           if(method == 'chat'){
             var message = obj['message'];
             var name    = obj['name'];
             var img     = obj['image'];
             renderChat(name,message,img);
           }
           if(method == 'whiteboard'){

             processWhiteboard(obj);
           }

           if(method == 'admin_control'){
             if(obj.action == 'mic'){
                if(obj.status == true){
                    //code for enable audio
                if(obj.id == socketId){
                    easyrtc.enableMicrophone(true);
                }

                }else{
                    //code for enable
                if(obj.id == socketId){
                    easyrtc.enableMicrophone(false);
                  }
                }
             }
             if(obj.action == 'cam'){
                if(obj.status == true){
                  //code for enable cam
                  //alert(obj.id+'//'+socketId);
                  if(obj.id == socketId){

                    easyrtc.enableCamera(true);
                  }
                }else{
                  //code for disable cam
                  if(obj.id == socketId){

                  easyrtc.enableCamera(false);
                  }
                }
             }
             if(obj.action == 'chat'){
                if(obj.status == true){
                    if(obj.id == socketId){
                      enableChat();
                   }
                }else{
                   if(obj.id == socketId){
                   disableChat();
                  }
                }
             }
             if(obj.action == 'doc'){
                if(obj.status == true){
                    if(obj.id == socketId){
                   presentation_active = 1;
                   presentationAdded();
                  }
                }else{
                  if(obj.id == socketId){
                   presentation_active = 0;
                   presentationRemoved();
                 }
                }
             }
           }
           if(method == 'document_change'){

                 }
           if(method == 'slide_switch'){
              currentpage = obj['slide'];
              var current = obj['curslide'];
              $('#currentSlide').attr('src', current);
              $('.curpage').html(currentpage);
              $('.totalpage').html(totalpage); $('#next,#previous').hide();
           }

});
});
function adminControl(id,action){
   var checked    = $('#'+id+'_'+action).is(':checked');
   var obj = {};
       obj['id']    = id;
       obj['status']= checked;
       obj['action'] = action;
       obj['method'] = 'admin_control';
       sendDataToAll(obj);
}

var activeBox = -1;  // nothing selected
var aspectRatio = 4/3;  // standard definition video aspect ratio
var maxCALLERS = 11;
var numVideoOBJS = maxCALLERS+1;
var layout;
var chatgap   =  .70;
var browser_name = 'Chrome';
var initCalled   = 0;

easyrtc.dontAddCloseButtons(true);

function getIdOfBox(boxNum) {
    return "box" + boxNum;
}


function reshapeFull(parentw, parenth) {
    return {
        left:0,
        top:0,
        width:parentw,
        height:parenth
    };
}


var margin = 20;

function reshapeToFullSize(parentw, parenth) {
    var left, top, width, height;
    var margin= 20;

    if( parentw < parenth*aspectRatio){
        width = parentw -margin;
        height = width/aspectRatio;
    }
    else {
        height = parenth-margin;
        width = height*aspectRatio;
    }
    left = (parentw - width)/2;
    top = (parenth - height)/2;
    return {
        left:left,
        top:top,
        width:width,
        height:height
    };
}

//
// a negative percentLeft is interpreted as setting the right edge of the object
// that distance from the right edge of the parent.
// Similar for percentTop.
//
function setThumbSizeAspect(percentSize, percentLeft, percentTop, parentw, parenth, aspect) {

    var width, height;
    if( parentw < parenth*aspectRatio){
        width = parentw * percentSize;
        height = width/aspect;
    }
    else {
        height = parenth * percentSize;
        width = height*aspect;
    }
    var left;
    if( percentLeft < 0) {
        left = parentw - width;
    }
    else {
        left = 0;
    }
    left += Math.floor(percentLeft*parentw);
    var top = 0;
    if( percentTop < 0) {
        top = parenth - height;
    }
    else {
        top = 0;
    }
    top += Math.floor(percentTop*parenth);
    return {
        left:left,
        top:top,
        width:width,
        height:height
    };
}


function setThumbSize(percentSize, percentLeft, percentTop, parentw, parenth) {
    return setThumbSizeAspect(percentSize, percentLeft, percentTop, parentw, parenth, aspectRatio);
}

function setThumbSizeButton(percentSize, percentLeft, percentTop, parentw, parenth, imagew, imageh) {
    return setThumbSizeAspect(percentSize, percentLeft, percentTop, parentw, parenth, imagew/imageh);
}


var sharedVideoWidth  = 1;
var sharedVideoHeight = 1;

function reshape1of2(parentw, parenth) {
    if( layout== 'p' ) {
        return {
            left: (parentw-sharedVideoWidth)/2,
            top:  (parenth -sharedVideoHeight*2)/3,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        };
    }
    else {
        return{
            left: (parentw-sharedVideoWidth*2)/3,
            top:  (parenth -sharedVideoHeight)/2,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        }
    }
}



function reshape2of2(parentw, parenth){
    if( layout== 'p' ) {
        return {
            left: (parentw-sharedVideoWidth)/2,
            top:  (parenth -sharedVideoHeight*2)/3 *2 + sharedVideoHeight,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        };
    }
    else {
        return{
            left: (parentw-sharedVideoWidth*2)/3 *2 + sharedVideoWidth,
            top:  (parenth -sharedVideoHeight)/2,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        }
    }
}

function reshape1of3(parentw, parenth) {
    if( layout== 'p' ) {
        return {
            left: (parentw-sharedVideoWidth)/2,
            top:  (parenth -sharedVideoHeight*3)/4 ,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        };
    }
    else {
        return{
            left: (parentw-sharedVideoWidth*2)/3,
            top:  (parenth -sharedVideoHeight*2)/3,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        }
    }
}

function reshape2of3(parentw, parenth){
    if( layout== 'p' ) {
        return {
            left: (parentw-sharedVideoWidth)/2,
            top:  (parenth -sharedVideoHeight*3)/4*2+ sharedVideoHeight,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        };
    }
    else {
        return{
            left: (parentw-sharedVideoWidth*2)/3*2+sharedVideoWidth,
            top:  (parenth -sharedVideoHeight*2)/3,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        }
    }
}

function reshape3of3(parentw, parenth) {
    if( layout== 'p' ) {
        return {
            left: (parentw-sharedVideoWidth)/2,
            top:  (parenth -sharedVideoHeight*3)/4*3+ sharedVideoHeight*2,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        };
    }
    else {
        return{
            left: (parentw-sharedVideoWidth*2)/3*1.5+sharedVideoWidth/2,
            top:  (parenth -sharedVideoHeight*2)/3*2+ sharedVideoHeight,
            width: sharedVideoWidth,
            height: sharedVideoHeight
        }
    }
}


function reshape1of4(parentw, parenth) {
    return {
        left: (parentw - sharedVideoWidth*2)/3,
        top: (parenth - sharedVideoHeight*2)/3,
        width: sharedVideoWidth,
        height: sharedVideoHeight
    }
}

function reshape2of4(parentw, parenth) {
    return {
        left: (parentw - sharedVideoWidth*2)/3*2+ sharedVideoWidth,
        top: (parenth - sharedVideoHeight*2)/3,
        width: sharedVideoWidth,
        height: sharedVideoHeight
    }
}
function reshape3of4(parentw, parenth) {
    return {
        left: (parentw - sharedVideoWidth*2)/3,
        top: (parenth - sharedVideoHeight*2)/3*2 + sharedVideoHeight,
        width: sharedVideoWidth,
        height: sharedVideoHeight
    }
}

function reshape4of4(parentw, parenth) {
    return {
        left: (parentw - sharedVideoWidth*2)/3*2 + sharedVideoWidth,
        top: (parenth - sharedVideoHeight*2)/3*2 + sharedVideoHeight,
        width: sharedVideoWidth,
        height: sharedVideoHeight
    }
}

var boxUsed = [true, false, false, false];
var connectCount = 0;


function setSharedVideoSize(parentw, parenth) {
    layout = ((parentw /aspectRatio) < parenth)?'p':'l';
    var w, h;

    function sizeBy(fullsize, numVideos) {
        return (fullsize - margin*(numVideos+1) )/numVideos;
    }

    switch(layout+(connectCount+1)) {
        case 'p1':
        case 'l1':
            w = sizeBy(parentw, 1);
            h = sizeBy(parenth, 1);
            break;
        case 'l2':
            w = sizeBy(parentw, 2);
            h = sizeBy(parenth, 1);
            break;
        case 'p2':
            w = sizeBy(parentw, 1);
            h = sizeBy(parenth, 2);
            break;
        case 'p4':
        case 'l4':
        case 'l3':
            w = sizeBy(parentw, 2);
            h = sizeBy(parenth, 2);
            break;
        case 'p3':
            w = sizeBy(parentw, 1);
            h = sizeBy(parenth, 3);
            break;
    }
    sharedVideoWidth = Math.min(w, h * aspectRatio);
    sharedVideoHeight = Math.min(h, w/aspectRatio);
}

var reshapeThumbs = [
    function(parentw, parenth) {

        if( activeBox > 0 ) {
            return setThumbSize(0.20, 0.01, 0.01, parentw, parenth);
        }
        else {
            setSharedVideoSize(parentw, parenth)
            switch(connectCount) {
                case 0:return reshapeToFullSize(parentw, parenth);
                case 1:return reshape1of2(parentw, parenth);
                case 2:return reshape1of3(parentw, parenth);
                case 3:return reshape1of4(parentw, parenth);
            }
        }
    },
    function(parentw, parenth) {
        if( activeBox >= 0 || !boxUsed[1]) {
            return setThumbSize(0.20, 0.01, -0.01, parentw, parenth);
        }
        else{
            switch(connectCount) {
                case 1:
                    return reshape2of2(parentw, parenth);
                case 2:
                    return reshape2of3(parentw, parenth);
                case 3:
                    return reshape2of4(parentw, parenth);
            }
        }
    },
    function(parentw, parenth) {
        if( activeBox >= 0 || !boxUsed[2] ) {
            return setThumbSize(0.20, -0.01, 0.01, parentw, parenth);
        }
        else  {
            switch(connectCount){
                case 1:
                    return reshape2of2(parentw, parenth);
                case 2:
                    if( !boxUsed[1]) {
                        return reshape2of3(parentw, parenth);
                    }
                    else {
                        return reshape3of3(parentw, parenth);
                    }
                case 3:
                    return reshape3of4(parentw, parenth);
            }
        }
    },
    function(parentw, parenth) {
        if( activeBox >= 0 || !boxUsed[3]) {
            return setThumbSize(0.20, -0.01, -0.01, parentw, parenth);
        }
        else{
            switch(connectCount){
                case 1:
                    return reshape2of2(parentw, parenth);
                case 2:
                    return reshape3of3(parentw, parenth);
                case 3:
                    return reshape4of4(parentw, parenth);
            }
        }
    },
];



function handleWindowResize() {
    return;
    var fullpage = document.getElementById('fullpage');
    connectCount = easyrtc.getConnectionCount();

    function applyReshape(obj,  parentw, parenth) {
        var myReshape = obj.reshapeMe(parentw, parenth);

        if(typeof myReshape.left !== 'undefined' ) {
            obj.style.left = Math.round(myReshape.left) + "px";
        }
        if(typeof myReshape.top !== 'undefined' ) {
            obj.style.top = Math.round(myReshape.top) + "px";
        }
        if(typeof myReshape.width !== 'undefined' ) {
            obj.style.width = Math.round(myReshape.width) + "px";
        }
        if(typeof myReshape.height !== 'undefined' ) {
            obj.style.height = Math.round(myReshape.height) + "px";
        }

        var n = obj.childNodes.length;
        for(var i = 0; i < n; i++ ) {
            var childNode = obj.childNodes[i];
            if( childNode.reshapeMe) {
                applyReshape(childNode, myReshape.width, myReshape.height);
            }
        }
    }

    applyReshape(fullpage, (window.innerWidth*chatgap), window.innerHeight-50);
}


function setReshaper(elementId, reshapeFn) {
    var element = document.getElementById(elementId);
    if( !element) {
        alert("Attempt to apply to reshapeFn to non-existent element " + elementId);
    }
    if( !reshapeFn) {
        //alert("Attempt to apply misnamed reshapeFn to element " + elementId);
    }
    element.reshapeMe = reshapeFn;
}



function callEverybodyElse(roomName, otherPeople) {

    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    var list = [];
    var connectCount = 0;
    for(var easyrtcid in otherPeople ) {
        list.push(easyrtcid);
    }
    //
    // Connect in reverse order. Latter arriving people are more likely to have
    // empty slots.
    //
    function establishConnection(position) {
        function callSuccess() {
            connectCount++;
            if( connectCount < maxCALLERS && position > 0) {
                establishConnection(position-1);
            }
        }
        function callFailure(errorCode, errorText) {
            easyrtc.showError(errorCode, errorText);
            if( connectCount < maxCALLERS && position > 0) {
                establishConnection(position-1);
            }
        }
        easyrtc.call(list[position], callSuccess, callFailure);

    }
    if( list.length > 0) {
        establishConnection(list.length-1);
    }
}

function successFun(roomname){
   alert(roomname);
}
function loginSuccess() {
    expandThumb(0);  // expand the mirror image initially.

}

function expandThumb(whichBox) {
    var lastActiveBox = activeBox;
    if( activeBox >= 0 ) {
        collapseToThumbHelper();
    }
    if( lastActiveBox != whichBox) {
        var id = getIdOfBox(whichBox);
        activeBox = whichBox;
        setReshaper(id, reshapeToFullSize);
        document.getElementById(id).style.zIndex = 1;

    }
    handleWindowResize();
}
function collapseToThumbHelper() {
    if( activeBox >= 0) {
        var id = getIdOfBox(activeBox);
        document.getElementById(id).style.zIndex = 2;
        setReshaper(id, reshapeThumbs[activeBox]);

        activeBox = -1;
    }
}

function collapseToThumb() {
    collapseToThumbHelper();
    activeBox = -1;
    handleWindowResize();

}
function prepVideoBox(whichBox) {
    var id = getIdOfBox(whichBox);
    setReshaper(id, reshapeThumbs[whichBox]);
    document.getElementById(id).onclick = function() {
        expandThumb(whichBox);
    };
}
function sendText(message) {
        var stringToSend = message;
        if( stringToSend && stringToSend != "") {
            for(var i = 0; i < maxCALLERS; i++ ) {
                var easyrtcid = easyrtc.getIthCaller(i);
                if( easyrtcid && easyrtcid != "") {
                    easyrtc.sendPeerMessage(easyrtcid, "im",  stringToSend);
                }
            }
          } runtime();
          return false;
    }
function messageListener(easyrtcid, msgType, content) {
       var obj    = JSON.parse(content);
       var method = obj['method'];

       if(method == 'chat'){
         var message = obj['message'];
         var name    = obj['name'];
         var img     = obj['image'];
         renderChat(name,message,img);
       }
       if(method == 'whiteboard'){

         processWhiteboard(obj);
       }
       if(method == 'document_change'){

			 }
       if(method == 'slide_switch'){
          currentpage = obj['slide'];
          var current = obj['curslide'];
          $('#currentSlide').attr('src', current);
          $('.curpage').html(currentpage);
          $('.totalpage').html(totalpage); $('#next,#previous').hide();
       }

    }

$('document').ready(function(){

          controlScreenShareButton();
          appInit();
          if(mode == 0){
            $('.ctrl-holdrs').hide();
            $('#next,#previous').hide();
            $('#wb_tools').hide();
            $('#enable_cam').hide();

          }else{
             $('#adm_contrl').show();
             $('#contrlPop').show();
          }
          if(camAllow == 0){
            $('#cam-close').hide();
            $('#presentation').addClass('pres-vid-dis');
            $('#layout').width(1);
            $('#layout').hide();
            $('#currentSlide').addClass('novideo-slide');
            $('.ctrl-holdrs').addClass('widthCtrl');
          }
          $('#adm_contrl').click(function(){
            $('#contrlPop').toggle();
          })
          $('#cam-close').click(function(){

            if(camenable == 1){

                    camenable = 0;
                    $('#cam-close-but').show();
                    $('#vid-cam').addClass('close-parent');
                    easyrtc.enableCamera(false);

            }else{
                   camenable = 1;
                   $('#cam-close-but').hide();
                   $('#vid-cam').removeClass('close-parent');
                   easyrtc.enableCamera(true);
            }
            $('#enable_cam').hide();
        });
        $('#mic-close').click(function(){

            if(micenable == 1){

               micenable = 0;
               $('#mic-close-but').show();
               $('#mic-but').addClass('close-parent-mic');
               easyrtc.enableMicrophone(false);

            }else{

               micenable = 1;
               $('#mic-close-but').hide();
               $('#mic-but').removeClass('close-parent-mic');
               easyrtc.enableMicrophone(true);
            }

            //alert(camenable);
        });
        $('#screen-share').click(function(){

            if(screenenable == 1){

               //screenenable = 0;
               //$('#screen-close-but').hide();
               //$('#screen-but').removeClass('close-parent');
               window.location="https://localhost:8080?name="+user_name+"&room="+roomname;


            }else{

               //screenenable = 1;
               //$('#screen-close-but').show();
               //$('#screen-but').addClass('close-parent');
               window.location="https://localhost:8080?name="+user_name+"&room="+roomname+"&screen=1";



            }
            //alert(camenable);
        });
        $('#hide-ppt').click(function(){

            if(presentation_active == 1){

               presentation_active = 0;
               presentationRemoved();

            }else{

               presentation_active = 1;
               presentationAdded();
            }


        });
        if(chatenable == 0){
               $('#chat-cam').addClass('close-parent');
               if(presentation_active == 1){
                document.getElementById('layout').style.right = '500px';
                document.getElementById('presentation').style.right = '0px';
               }else{
                document.getElementById('layout').style.right = '0px';
               }
               if(camAllow == 0){
                   $('.ctrl-holdrs').removeClass('widthCtrl');
                   $('.ctrl-holdrs').addClass('widthCtrl1');
               }else{
                $('.ctrl-holdrs').addClass('widthCtrl');
               }
               $("#chat-holder").animate({width:'0px'}, 10);
               $('#chat-close').hide();

               layout();
        }
        $('#chat-close').click(function(){

            if(chatenable == 1){

               disableChat();


            }else{

               enableChat();
            }
            //alert(camenable);
        });

        $('#close-part').click(function(){
            $('#contrlPop').hide();
        });
        $('#close-allow').click(function(){
            $('#enable_cam').hide();
        });

});
function disableChat(){
    chatenable = 0;
               $('#chat-close-but').show();
               $('#chat-cam').addClass('close-parent');
               if(presentation_active == 1){
                document.getElementById('layout').style.right = '500px';
                document.getElementById('presentation').style.right = '0px';
               }else{
                document.getElementById('layout').style.right = '0px';
               }

               $("#chat-holder").animate({width:'0px'}, 1000).hide();
               layout();
}
function enableChat(){
     chatenable = 1;
               $('#chat-close-but').hide();
               $('#chat-cam').removeClass('close-parent');
               if(presentation_active == 1){
                document.getElementById('layout').style.right = '730px';
                document.getElementById('presentation').style.right = '230px';
               }else{
                document.getElementById('layout').style.right = '230px';
               }
               $("#chat-holder").animate({width:'230px'}, 1000).show();
               layout();
}
function controlScreenShareButton(){
        if(screenenable == '1'){
          $('#screen-close-but').show();
          $('#screen-but').addClass('close-parent');
        }else{

          $('#screen-close-but').hide();
          $('#screen-but').removeClass('close-parent');
        }
}

function leaveRoom(roomname){
    easyrtc.hangupAll();
    easyrtc.leaveRoom(roomname,
      function(roomName) {
        easyrtc.disconnect();
        easyrtc.clearMediaStream( document.getElementById('box0'));
        setTimeout(function(){
          appInit();
        },5000);

           console.log("No longer in room " + roomName);
      },
      function(errorCode, errorText, roomName) {
          console.log("had problems leaving " + roomName);

      });
}

function appInit() {
    if(screenenable == '1'){
        captureUserMedia();
    }else{
        initEasyrtc();
    }

    initCalled = 1;
}

function initEasyrtc(){
    easyrtc.joinRoom(roomname, null , successFun, null);
    // Prep for the top-down layout manager

    //if(micenable == 0){
      // easyrtc.enableAudio(false);
    //}

    if(camAllow == 0){
       easyrtc.enableVideo(false);
    }
    if(screenenable == 1){
       easyrtc.setScreenCapture();
    }
    easyrtc.setRoomOccupantListener(callEverybodyElse);

    easyrtc.easyApp("easyrtc.multiparty", "box0", ["box1", "box2", "box3", "box4","box5","box6","box7", "box8","box9","box10","box11"],function(easyrtcId){
                      //alert("successfully connected, I am " + easyrtcId);
                      $('#enable_device').hide();
                        easyrtc.enableMicrophone(false);
                        easyrtc.enableCamera(false);
                   },
                   function(errorCode, errorText){
                       alert(errorText);
                   });
    easyrtc.setPeerListener(messageListener);

    easyrtc.setDisconnectListener( function() {
        easyrtc.showError("LOST-CONNECTION", "Lost connection to signaling server");
    });
    easyrtc.setOnCall( function(easyrtcid, slot) {

        document.getElementById(getIdOfBox(slot+1)).style.visibility = "visible";

    });



    easyrtc.setOnHangup(function(easyrtcid, slot) {

        setTimeout(function() {
            document.getElementById(getIdOfBox(slot+1)).style.visibility = "hidden";

            if( easyrtc.getConnectionCount() == 0 ) { // no more connections


            }

        },20);
    });
}
/*
*
code for screenshare
*
*/
var called = 0;
function completed(constraints){
   if(called == 0){
        called = 1;
        globalConstraint =  constraints;
        initEasyrtc();
   }

}
    /*
}
*  screen share start
*
*/

                var isWebRTCExperimentsDomain = document.domain.indexOf('webrtc-experiment.com') != -1;

                function captureUserMedia(callback, extensionAvailable)
                {

                    //console.log('captureUserMedia chromeMediaSource', DetectRTC.screen.chromeMediaSource);

                    var screen_constraints = {
                        mandatory: {
                            chromeMediaSource: DetectRTC.screen.chromeMediaSource,
                            maxWidth: screen.width > 1920 ? screen.width : 1920,
                            maxHeight: screen.height > 1080 ? screen.height : 1080
                            // minAspectRatio: 1.77
                        },
                        optional: [{ // non-official Google-only optional constraints
                            googTemporalLayeredScreencast: true
                        }, {
                            googLeakyBucket: true
                        }]
                    };
                    // try to check if extension is installed.
                    if(isChrome && isWebRTCExperimentsDomain && typeof extensionAvailable == 'undefined' && DetectRTC.screen.chromeMediaSource != 'desktop') {
                        DetectRTC.screen.isChromeExtensionAvailable(function(available) {
                            captureUserMedia(callback, available);
                        });
                        return;
                    }

                    if(isChrome && isWebRTCExperimentsDomain && DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
                        DetectRTC.screen.getSourceId(function(error) {
                            if(error && error == 'PermissionDeniedError') {
                                alert('PermissionDeniedError: User denied to share content of his screen.');
                            }

                            captureUserMedia(callback);
                        });
                        return;
                    }

                    // for non-www.webrtc-experiment.com domains
                    if(isChrome && !isWebRTCExperimentsDomain && !DetectRTC.screen.sourceId) {
                        window.addEventListener('message', function (event) {
                            if (event.data && event.data.chromeMediaSourceId) {
                                var sourceId = event.data.chromeMediaSourceId;
                                DetectRTC.screen.sourceId = sourceId;
                                DetectRTC.screen.chromeMediaSource = 'desktop';
                                if (sourceId == 'PermissionDeniedError') {
                                    return alert('User denied to share content of his screen.');
                                }
                                captureUserMedia(callback, true);
                            }
                            if (event.data && event.data.chromeExtensionStatus) {
                                //alert(event.data.chromeExtensionStatus);
                                DetectRTC.screen.chromeMediaSource = 'screen';
                                if(event.data.chromeExtensionStatus!="not-installed")
                                {
                                      captureUserMedia(callback, true);
                                }
                                else
                                {
                                    if(browser_name=='Chrome')
                                    {

                                        var inst_html = '<button type="button" onclick="installPlugin()" class="blue-button">Click to Install</button>';
                                        $("#modal").html("<h3>Message</h3> <p>You need to install chrome extension for screenshare. After installation reload the application.</p>"+inst_html).modal();
                                    }
                                    else
                                    {

                                        $("#modal").html("<h3>Message</h3> <p>Screen share is only supported in chrome and firefox</p>").modal();
                                    }

                                }

                            }
                            ////console.log("scr-status="+event.data);
                        });
                        screenFrame.postMessage();
                        return;
                    }

                    if(isChrome && DetectRTC.screen.chromeMediaSource == 'desktop') {
                        screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
                    }

                    var constraints = {
                        audio: false,
                        video: screen_constraints
                    };

                    if(!!navigator.mozGetUserMedia) {
                           screen_constraints = {
                                                mozMediaSource: 'screen',
                                                mediaSource: 'screen',
                                                maxFrameRate: 1,
                                                width: { ideal: 640 },
                                                height: { ideal: 360 }
                                            };
                            var constraints = {
                                audio: false,
                                video: screen_constraints
                            };

                    }

                    completed(constraints);

                    ////console.log( JSON.stringify( constraints , null, '\t') );
                }
                function installPlugin()
                {
                    var win = window.open('https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk', '_blank');
                    win.focus();
                   // $("#install-button").trigger("click");
                }
/*
* screen share init
*
*/
(function() {


            var uniqueToken = document.getElementById('unique-token');
            if (uniqueToken)
            if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
            else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');
            })();

                var Firefox_Screen_Capturing_Warning = 'Make sure that you are using Firefox Nightly and you enabled: media.getusermedia.screensharing.enabled flag from about:config page. You also need to add your domain in "media.getusermedia.screensharing.allowed_domains" flag.';

                var screenFrame, loadedScreenFrame;

                function loadScreenFrame(skip) {
                    if(loadedScreenFrame) return;
                    if(!skip) return loadScreenFrame(true);
                    loadedScreenFrame = true;
                    var iframe = document.createElement('iframe');
                    iframe.onload = function () {
                        iframe.isLoaded = true;
                        //console.log('Screen Capturing frame is loaded.');

                    };
                    iframe.src = 'https://www.webrtc-experiment.com/getSourceId/';
                    iframe.style.display = 'none';
                    (document.body || document.documentElement).appendChild(iframe);
                    screenFrame = {
                        postMessage: function () {
                            if (!iframe.isLoaded) {
                                setTimeout(screenFrame.postMessage, 100);
                                return;
                            }
                            //console.log('Asking iframe for sourceId.');
                            iframe.contentWindow.postMessage({
                                captureSourceId: true
                            }, '*');
                        }
                    };
                };

                if(!isWebRTCExperimentsDomain) {
                    loadScreenFrame();
                }


                // todo: need to check exact chrome browser because opera also uses chromium framework
                var isChrome = !!navigator.webkitGetUserMedia;

                // DetectRTC.js - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DetectRTC
                // Below code is taken from RTCMultiConnection-v1.8.js (http://www.rtcmulticonnection.org/changes-log/#v1.8)
                var DetectRTC = {};
               // initScreen();
                //function initScreen(){
                (function () {

                    var screenCallback;
                    DetectRTC.screen = {
                        chromeMediaSource: 'screen',
                        getSourceId: function(callback) {
                            if(!callback) throw '"callback" parameter is mandatory.';
                            screenCallback = callback;
                            window.postMessage('get-sourceId', '*');
                        },
                        isChromeExtensionAvailable: function(callback) {
                            if(!callback) return;

                            if(DetectRTC.screen.chromeMediaSource == 'desktop') return callback(true);

                            // ask extension if it is available
                            window.postMessage('are-you-there', '*');

                            setTimeout(function() {
                                if(DetectRTC.screen.chromeMediaSource == 'screen') {
                                    callback(false);
                                }
                                else callback(true);
                            }, 2000);
                        },
                        onMessageCallback: function(data) {
                            if (!(typeof data == 'string' || !!data.sourceId)) return;

                            //console.log('chrome message', data);

                            // "cancel" button is clicked
                            if(data == 'PermissionDeniedError') {
                                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                                if(screenCallback) return screenCallback('PermissionDeniedError');
                                else throw new Error('PermissionDeniedError');
                            }

                            // extension notified his presence
                            if(data == 'rtcmulticonnection-extension-loaded') {
                                if(document.getElementById('install-button')) {
                                    document.getElementById('install-button').parentNode.innerHTML = '<strong>Great!</strong> <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Google chrome extension</a> is installed.';
                                }
                                DetectRTC.screen.chromeMediaSource = 'desktop';
                            }

                            // extension shared temp sourceId
                            if(data.sourceId) {
                                DetectRTC.screen.sourceId = data.sourceId;
                                if(screenCallback) screenCallback( DetectRTC.screen.sourceId );
                            }
                        },
                        getChromeExtensionStatus: function (callback) {
                            if (!!navigator.mozGetUserMedia) return callback('not-chrome');

                            var extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk';
                            var image = document.createElement('img');
                            image.src = 'chrome-extension://' + extensionid + '/icon.png';
                            image.onload = function () {
                                DetectRTC.screen.chromeMediaSource = 'screen';
                                window.postMessage('are-you-there', '*');
                                setTimeout(function () {
                                    if (!DetectRTC.screen.notInstalled) {
                                        callback('installed-enabled');
                                    }
                                }, 2000);
                            };
                            image.onerror = function () {
                                DetectRTC.screen.notInstalled = true;
                                callback('not-installed');
                            };
                        }
                    };

                    // check if desktop-capture extension installed.
                    if(window.postMessage && isChrome) {
                        DetectRTC.screen.isChromeExtensionAvailable();
                    }
                })();

            //}

                DetectRTC.screen.getChromeExtensionStatus(function(status) {
                    if(status == 'installed-enabled') {
                       // alert('Extension installed');
                        DetectRTC.screen.chromeMediaSource = 'desktop';
                    }
                });

                window.addEventListener('message', function (event) {
                    if (event.origin != window.location.origin) {
                        return;
                    }

                    DetectRTC.screen.onMessageCallback(event.data);
                });
/*
* get browser name
*/
var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
function getBrowserInfo()
{
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;
    var screenshareok = 0;
    // In Opera, the true version is after 'Opera' or after 'Version'
    if ((verOffset = nAgt.indexOf('OPR')) !== -1) {
        browserName = 'Opera';
        fullVersion = nAgt.substring(verOffset + 6);

        if ((verOffset = nAgt.indexOf('Version')) !== -1) {
            fullVersion = nAgt.substring(verOffset + 8);
        }
    }
    // In MSIE, the true version is after 'MSIE' in userAgent
    else if ((verOffset = nAgt.indexOf('MSIE')) !== -1) {
        browserName = 'IE';
        fullVersion = nAgt.substring(verOffset + 5);
    }
    // In Chrome, the true version is after 'Chrome'
    else if ((verOffset = nAgt.indexOf('Chrome')) !== -1) {
        browserName = 'Chrome';
        fullVersion = nAgt.substring(verOffset + 7);
        screenshareok = 1;
    }
    // In Safari, the true version is after 'Safari' or after 'Version'
    else if ((verOffset = nAgt.indexOf('Safari')) !== -1) {
        browserName = 'Safari';
        fullVersion = nAgt.substring(verOffset + 7);

        if ((verOffset = nAgt.indexOf('Version')) !== -1) {
            fullVersion = nAgt.substring(verOffset + 8);
        }
    }
    // In Firefox, the true version is after 'Firefox'
    else if ((verOffset = nAgt.indexOf('Firefox')) !== -1) {
        browserName = 'Firefox';
        fullVersion = nAgt.substring(verOffset + 8);
        screenshareok = 1;
    }

    // In most other browsers, 'name/version' is at the end of userAgent
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);

        if (browserName.toLowerCase() === browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }

    if (isEdge) {
        browserName = 'Edge';
        // fullVersion = navigator.userAgent.split('Edge/')[1];
        fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10);
    }

    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    if ((ix = fullVersion.indexOf(' ')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }
    if(browserName == "Netscape"){ browserName ="Internet Explorer"; }

    if(screenshareok==0)
    {
       // $('#screen-li').html('Screen share is only supported in chrome and firefox');
    }
    return {
        fullVersion: fullVersion,
        version: majorVersion,
        name: browserName
    };
}
browser_name = getBrowserInfo();
browser_name     = browser_name.name;

function sendDataToAll(obj){
    obj.room   =  roomname;
    socket.emit('sendToAll',obj);

}

