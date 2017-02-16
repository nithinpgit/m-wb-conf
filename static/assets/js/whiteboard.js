var canvas = document.getElementById('canvas');
var ctx = canvas ? canvas.getContext('2d') : "";

var canvas2 = document.getElementById('canvas2');
var ctx2 = canvas2 ? canvas2.getContext('2d') : "";

var rect = {}, drag = false, textFlag = false, editflag = false;
var whiteboard = $("#canvas2");
var yAdjust = 111, xAdjust = 248 ,actualYAdjust = 111;actualXAdjust = 248;
var s='pen', lw, col, lcol;

var img, histCount = 1, histSave = {}, ctrlPressed = false, ppts = [], lastX = 0, lastY = 0, interval = 16;
var wb = {}, jsonMsg, markerPoints = [], histLastId, histId = 0;
var file_name_generated = '', file_extension = '', data = {}, cancel_request = 0, imgWidth = 0, jqXHR;
var wb_mode = '1', histArray = {}, inputStore = {}, elapsedTime = 0, currentDoc = {},zoomLevel = 5; whiteboardHeightAdjust = 0;
var is_load_presentation = 0;
var receivedZoomLevel  = 5;
var canvasWidth, canvasHeight;
var lineThick = 2;
var lineColor = '#000000';
var fillColor = '#ffffff';
var measureDiv = $("<div class='measure-div'>");
$("body").append(measureDiv);
function init(){
	canvas = document.getElementById('canvas');
	ctx = canvas ? canvas.getContext('2d') : "";
	canvas2 = document.getElementById('canvas2');
	ctx2 = canvas2 ? canvas2.getContext('2d') : "";
	whiteboard = $('#whiteboard');
	yAdjust = 36; xAdjust = $('#layout').width();actualXAdjust = $('#layout').width();
	canvasWidth = whiteboard.width();
	canvasHeight = whiteboard.height();
	canvas.width = canvas2.width = canvasWidth;
	canvas.height = canvas2.height = canvasHeight;
	wb = {wbw: canvasWidth, wbh: canvasHeight};
	wb_mode = '1';
	
	//whiteboard.drawTouch();
    //whiteboard.drawPointer();
}

$(function(){
		$("#currentSlide").bind('load', function() {
			init();
			wb_mode = currentpage;
			//alert(wb_mode);
		    recreateDrawings();
		
		});
	    init();
	    whiteboard.on("mousedown", function(e){		
	        console.log('before mouse down =>'+JSON.stringify(histArray));	
			mouseDown(e.pageX - canvas.offsetLeft - xAdjust, e.pageY - canvas.offsetTop - yAdjust);
			console.log('after mouse down =>'+JSON.stringify(histArray));	
		});
		whiteboard.on("mouseup", function(e){
			
			mouseUp();

		});
		whiteboard.on("mouseleave", function(e){
			drag = false;
		});
		whiteboard.on("mouseenter", function(e){
			//s = $("#shape").val();
		});
		whiteboard.on("mousemove", function(e){
			mouseMove(e.pageX - canvas.offsetLeft - xAdjust, e.pageY - canvas.offsetTop - yAdjust);
		});
		whiteboard.on("click", function(e){
			if(e.target.className != "canvas-ip") {
				if(textFlag){

					rect.startX = e.pageX - canvas.offsetLeft - xAdjust;
					rect.startY = e.pageY - canvas.offsetTop - yAdjust;
					rect.col = lineColor;
					if(writeText(rect)){
						// textFlag = false;
					} 
				}
				
				// $("#text").parent().removeClass("addcolor");
			}
			rect = {};
		});
	
})

function mouseDown(x, y){
	rect.startX = x;
	rect.startY = y;
	
	ppts = [];
	ppts.push({x: rect.startX, y: rect.startY});
	//s = $("#shape").val();
	rect.lw = lineThick;
	rect.col = fillColor;
	rect.lcol = lineColor;
	
	if(s == "highlighter" || s == "eraser"){
		rect.lw = 22;
	}
	if(textFlag || s == "marker" || s == "clear"){
		drag = false;
	} else {
		drag = true; 
	}
}
function mouseMove(x, y){
	if (drag) {
		rect.newX = x;
		rect.newY = y;
	    if(s != "pen"){
	    	clearCanvas(ctx);
	    }
	    console.log(s);
	    drawShape(ctx, rect, s); 
	}
}
function drawShape(c, r, s, p){
	switch(s){
		case "rectangle": 
			drawRectangle(c, r);
			break;
		case "ellipse":
			drawEllipse(c, r);
			break;
		case "pen":
			if(p){
				redrawPen(c, r);
			}else{
				drawPen(c, r);
			}
			break;
		case "highlighter":
			r.lcol = "rgba(255,0,0,0.5)"
			drawHighlighter(c, r);
			break;
		case "eraser":
			r.lcol = "#FFF";
			drawHighlighter(c, r);
			break;
		default:
	}	
}
function drawRectangle(c, r){
	r.w = r.newX - r.startX;
	r.h = r.newY - r.startY;
	c.beginPath();
	c.rect(r.startX, r.startY, r.w, r.h);
	c.closePath();
	c.fillStyle = r.col;
	//c.fill();
	c.lineWidth = r.lw;
	c.strokeStyle = r.lcol;
	c.stroke();
}
function drawEllipse(c, r) {
	r.w = r.newX - r.startX;
	r.h = r.newY - r.startY;
	c.beginPath();
	c.moveTo(r.startX + r.w/2, r.startY); // A1
	
	c.bezierCurveTo(
	  r.startX + r.w, r.startY, // C1
	  r.startX + r.w, r.startY + r.h, // C2
	  r.startX + r.w/2, r.startY + r.h); // A2

	c.bezierCurveTo(
	  r.startX, r.startY + r.h, // C3
	  r.startX, r.startY, // C4
	  r.startX + r.w/2, r.startY); // A1
	c.closePath();	
	c.lineWidth = r.lw;
	c.fillStyle = r.col;
	//c.fill();
	c.strokeStyle = r.lcol;
	c.stroke();
}
function drawHighlighter(ct, r) {
	ppts.push({x: r.newX, y: r.newY});
	ct.lineWidth = r.lw
	ct.lineJoin = 'round';
	ct.lineCap = 'round';
	ct.strokeStyle = r.lcol;

	if (ppts.length < 3) {
		return;
	}

	ct.beginPath();
	ct.moveTo(ppts[0].x, ppts[0].y);
	
	for (var i = 1; i < ppts.length - 2; i++) {
		var c = (ppts[i].x + ppts[i + 1].x) / 2;
		var d = (ppts[i].y + ppts[i + 1].y) / 2;
		
		ct.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
	}
	
	// For the last 2 points
	ct.quadraticCurveTo(
		ppts[i].x,
		ppts[i].y,
		ppts[i + 1].x,
		ppts[i + 1].y
	);
	
	
	ct.stroke();
}
function drawPen(ct, r) {
	ppts.push({x: r.newX, y: r.newY});
	ct.beginPath();
	if(ppts.length == 2){
		lastX = r.startX;
		lastY = r.startY;
		ct.moveTo(lastX, lastY);
	}
	var c = (lastX + r.newX) / 2;
	var d = (lastY + r.newY) / 2;
	ct.quadraticCurveTo(lastX, lastY, c, d);
	ct.quadraticCurveTo(c, d, r.newX, r.newY);

	ct.lineWidth = r.lw;
	ct.lineJoin = 'round';
	ct.lineCap = 'round';
	ct.strokeStyle = r.lcol;
	ct.stroke();
	lastX = rect.newX;
	lastY = rect.newY;
	console.log(r);
}
function redrawPen(ct, r) {
	ct.lineWidth = r.lw;
	ct.lineJoin = 'round';
	ct.lineCap = 'round';
	ct.strokeStyle = r.lcol;
	if (ppts.length < 3) {
		var b = ppts[0];
		ct.beginPath();
		ct.arc(b.x, b.y, ct.lineWidth / 2, 0, Math.PI * 2, !0);
		ct.fill();
		ct.closePath();
		
		return;
	}
	ct.beginPath();
	ct.moveTo(ppts[0].x, ppts[0].y);
	for (var i = 1; i < ppts.length - 2; i++) {
		var c = (ppts[i].x + ppts[i + 1].x) / 2;
		var d = (ppts[i].y + ppts[i + 1].y) / 2;
		
		ct.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
	}
	ct.quadraticCurveTo(
		ppts[i].x,
		ppts[i].y,
		ppts[i + 1].x,
		ppts[i + 1].y
	);
	ct.stroke();
}
function mouseUp(){
	    var p = true;
		drawShape(ctx2, rect, s, p);
		var re = {};
		    re.startX = rect.startX;
		    re.startY = rect.startY;
		    re.lw = rect.lw;
		    re.col = rect.col;
		    re.lcol = rect.lcol;
		    re.newX = rect.newX;
		    re.newY = rect.newY;
		    re.w = rect.w;
		    re.h = rect.h;
		jsonMsg = {method: "whiteboard", values: {wb: wb, r: rect, s: s, p: p, ppts: ppts}};
		sendToAll(JSON.stringify(jsonMsg));
		if(s != "" && drag == true){
			storeHistory({wb: { wbw: canvasWidth, wbh: canvasHeight }, s: s, r: re, p: p, ppts: ppts });
			clearCanvas(ctx);
		}
		ppts = [];
		drag = false;
}
function sendToAll(jsonMsg){
    sendDataToAll(JSON.parse(jsonMsg));
}
function clearCanvas(c){
	c.clearRect(0,0,canvas.width,canvas.height);
}
var storeHistory = function (obj) {
	
	if(histArray[wb_mode] == undefined){
		histArray[wb_mode] = [];
		histSave[wb_mode] = { lastidx:0, count:0 };
	}
	if(histSave[wb_mode].count > 0){
		histSave[wb_mode].lastidx = histSave[wb_mode].count - 1;
		histArray[wb_mode] = histArray[wb_mode].slice(0, histSave[wb_mode].count);
	}
	histCount = histArray[wb_mode].push(obj);
	histSave[wb_mode].lastidx = histCount - 1;
	histSave[wb_mode].count = histCount;
};

function changeColor(elem,color){
    fillColor = color;
    lineColor = color;
    $('.color').removeClass('selected');
    elem.className += " selected";
}
function changeThick(elem,thick){
    lineThick = thick;
    $('.thick').removeClass('selected');
    elem.className += " selected";
}
function changeTool(elem,tool){
    
    if(tool == 'clear'){
    	clearCanvas(ctx2);
    	storeHistory({ s: "clear" });
    	//$('document').remove('.canvas-ip');
    	jsonMsg = {method: "whiteboard", clr: true};
		sendToAll(JSON.stringify(jsonMsg));
    }else{
    	s = tool;
        $('.draw').removeClass('selected');
        elem.className += " selected";
        if(s != "text"){
			textFlag = false;
		} else {
			drag = false;
			textFlag = true;
		}
    }
    
 }

 /*
       recreate board 

 */
 function recreateDrawings(){

	clearCanvas(ctx2);
	if(histArray[wb_mode] != undefined){
		var histJSON = JSON.stringify(histArray[wb_mode].slice(0, histSave[wb_mode].count));
		var wbdata = JSON.parse(histJSON);
		
		for(var y in wbdata){
			
			if(wbdata[y].wb){
				if(wbdata[y].r){
					wbdata[y].r.startX = recalculateX(wbdata[y].r.startX, wbdata[y].wb.wbw);
					wbdata[y].r.startY = recalculateY(wbdata[y].r.startY, wbdata[y].wb.wbh);
					wbdata[y].r.newX = recalculateX(wbdata[y].r.newX, wbdata[y].wb.wbw);
					wbdata[y].r.newY = recalculateY(wbdata[y].r.newY, wbdata[y].wb.wbh);
					wbdata[y].r.lw = recalculateY(wbdata[y].r.lw, wbdata[y].wb.wbh);
				}
				if(wbdata[y].ppts){
					for(var j in wbdata[y].ppts){
						wbdata[y].ppts[j].x = recalculateX(wbdata[y].ppts[j].x, wbdata[y].wb.wbw);
						wbdata[y].ppts[j].y = recalculateY(wbdata[y].ppts[j].y, wbdata[y].wb.wbh);
					}
				}
				switch(wbdata[y].s){
					case "text":
						wbdata[y].size = recalculateX(wbdata[y].size, wbdata[y].wb.wbw);
						writeTextInner(ctx2, wbdata[y].r, wbdata[y].txt, wbdata[y].size+"px");
						break;
					default:
						ppts = wbdata[y].ppts;
						drawShape(ctx2, wbdata[y].r, wbdata[y].s, wbdata[y].p);
				}
			} else if(wbdata[y].s == "clear") {
				clearCanvas(ctx2);
			}
		}
	}
}
function recalculateX(x,wbwidth){
   var wbwidthHere = canvas.width;
   var out = (x/wbwidth)*wbwidthHere;
   return out;
	
}

function recalculateY(y,wbheight){
	var wbheightHere = canvas.height;
	var out = (y/wbheight)*wbheightHere;
	//console.log("height in viewer : "+canvas.height+' yAdjust : '+yAdjust);
	return out;
}

function processWhiteboard(parsedMessage){
	var parsedValues;
	if(parsedMessage.values){
		parsedValues = parsedMessage.values;
		parsedValues.r.startX = recalculateX(parsedValues.r.startX, parsedValues.wb.wbw);
		parsedValues.r.startY = recalculateY(parsedValues.r.startY, parsedValues.wb.wbh);
		if(parsedValues.s != "marker"){
			parsedValues.r.newX = recalculateX(parsedValues.r.newX, parsedValues.wb.wbw);
			parsedValues.r.newY = recalculateY(parsedValues.r.newY, parsedValues.wb.wbh);
			parsedValues.r.lw = recalculateY(parsedValues.r.lw, parsedValues.wb.wbh);
			ppts = parsedValues.ppts;
			for(var j in ppts){
				ppts[j].x = recalculateX(ppts[j].x, parsedValues.wb.wbw);
				ppts[j].y = recalculateY(ppts[j].y, parsedValues.wb.wbh);
			}
			drawShape(ctx2, parsedValues.r, parsedValues.s, parsedValues.p);
			
			if(parsedValues.s == "text"){
				parsedValues.size = recalculateX(parsedValues.size, parsedValues.wb.wbw);
				if(parsedValues.temp == true){
					clearCanvas(ctx);
					writeTextInner(ctx, parsedValues.r, parsedValues.txt, parsedValues.size+"px");
				} else {
					clearCanvas(ctx);
					writeTextInner(ctx2, parsedValues.r, parsedValues.txt, parsedValues.size+"px");
					storeHistory({ wb: { wbw: canvasWidth, wbh: canvasHeight }, s: "text", r: parsedValues.r, txt: parsedValues.txt, size: parsedValues.size });
				}
			} else {
				storeHistory({wb: { wbw: canvasWidth, wbh: canvasHeight },s: parsedValues.s, r: parsedValues.r, p: parsedValues.p, ppts: parsedValues.ppts });
			}
		}
	}
	if(parsedMessage.clr){
		clearCanvas(ctx2);
		storeHistory({ s: "clear" });
	}
}

/* 
* Write text on main canvas
* @param r: rectangle object
*/
function writeText(r){
	arguments.callee.count = ++arguments.callee.count || 1;
	if(r.startY < 16 ){ return; }
	if((r.startY+35)>$('canvas').height())
	{
		r.startY = r.startY -35;
	}
	if((r.startX+240)>$('canvas').width())
	{
		r.startX = r.startX - (240-($('canvas').width() - r.startX));
	}
	//alert(r.startY+'//'+$('.video-holder').height());
	// Create text input and append it to whiteboard.
	var input  = $("<textarea class='canvas-ip'>"), inputid = "input"+arguments.callee.count;
	var top    = r.startY - 17, leftspace, inputCanvasSpace, inputCanvasHeight;
	var div    = $("<div class='canvas-div'>");
	var txtval = "";
	$("body").append(div);
	/*if(canvas.style.left == "50%"){
		// When Presentation is loaded.
		leftspace = whiteboard.width()*0.5 + r.startX - canvas.width*0.5 - 1;
		inputCanvasSpace = whiteboard.width() - leftspace - 4;
	} else {*/
		leftspace = r.startX - 1;
		inputCanvasSpace = canvas.width - leftspace - 4;
	// }
	inputCanvasHeight = (canvas.height - r.startY);
	
	input.css({"color":r.col, "top":top, "left":leftspace});
	whiteboard.append(input);
	input.focus();
	input.on("keyup", function(){
		txtval = $(this).val();
		// Create a div element to get the width of the text. 
		// This will be use to set the width of the input element.
		var newInputWidth = $(this).width();
		var newInputHeight = $(this).height();
		div.html(txtval.replace(/\n/g, "<br>"));
		var divWidth = div.width() + 20;
		var divHeight = div.height() + 21;
		if(divWidth > newInputWidth){
			newInputWidth = divWidth;
		}
		if(divHeight > newInputHeight){
			newInputHeight = divHeight;
		}
		// Restrict input element width if it is close to the right edge of the Whiteboard.
		if(newInputWidth >= inputCanvasSpace){
			div.width(inputCanvasSpace);
			$(this).width(inputCanvasSpace).height(newInputHeight);
		} else {
			$(this).width(newInputWidth).height(newInputHeight);
		}

		// Restrict input element height if it is close to the bottom edge of the Whiteboard.
		if(div.height() >= (inputCanvasHeight - 10)){
			$(this).height(inputCanvasHeight);
		}

		// Send text to the Viewer on 'keyup'. The text will be updated on the outer canvas.
		jsonMsg = {method: "whiteboard", values: {wb: { wbw: canvasWidth, wbh: canvasHeight }, r: r, s: "text", txt: txtval, size: 18, temp: true}};
		sendToAll(JSON.stringify(jsonMsg));
		// console.log(txtval);
	});
	input.on("blur", function(){
		// Save text to the inner canvas.
		writeTextInner(ctx2, r, txtval, "18px");
		storeHistory({wb: { wbw: canvasWidth, wbh: canvasHeight }, s: "text", r: r, txt: txtval, size: 18, id: inputid });

		// Send text to the Viewer on 'blur'. The text will be saved to the inner canvas.
		jsonMsg = {method: "whiteboard", values: {wb: { wbw: canvasWidth, wbh: canvasHeight }, r: r, s: "text", txt: txtval, size: 18, temp: false}};
		sendToAll(JSON.stringify(jsonMsg));
		/*inputStore[inputid] = input.detach();
		console.log(inputStore);*/
		input.remove();
	});
	return true;
}

/* 
* Write text on inner canvas
* @param c   : canvas context
* @param r   : rectangle object
* @param val : text value
* @param size: text size
*/
function writeTextInner(c, r, val, size){
	var leftspace, inputCanvasSpace;
	measureDiv.css({ "font-size": size }).html("M");
	var lineHeight = measureDiv.width() * 1.4;
	var lines;
	var y = r.startY;
	/*if(canvas.style.left == "50%"){
		// When Presentation is loaded.
		leftspace = whiteboard.width()*0.5 + r.startX - canvas.width*0.5 - 1;
		inputCanvasSpace = whiteboard.width() - leftspace - 4;
	} else {*/
		leftspace = r.startX - 1;
		inputCanvasSpace = canvas.width - leftspace - 4;
	// }
	val = fragmentText(c, val, inputCanvasSpace);
	if(!val) { return; }
	c.font = size + " Arial";
	c.fillStyle = r.col;
	if(typeof val == "object"){
		lines = val[0].split("\n");
	} else {
		lines = val.split("\n");
	}
	for (var i = 0; i < lines.length; ++i) {
		c.fillText(lines[i], r.startX, y);
		y += lineHeight;
	}			
}

/* 
* takes a string and a maxWidth and splits the text into lines 
* @param c 		 : canvas context
* @param text 	 : input text
* @param maxWidth: Maximum allowed width of text
* @return 		 : lines joined by newline character
*/ 
function fragmentText(c, text, maxWidth) { 
	var emmeasure = measureDiv.width();
	var spacemeasure = measureDiv.html(" ").width();

    if (maxWidth < emmeasure) // To prevent weird looping anamolies farther on.
    	return false;
        //throw "Can't fragment less than one character.";

    if (measureDiv.html(text).width() < maxWidth) { 
        return [text]; 
    } 

    var words = text.split(' '), 
        metawords = [],
        lines = [];

    // measure first.
    for (var w in words) {
        var word = words[w];
        var measure = measureDiv.html(word).width();

        // Edge case - If the current word is too long for one line, break it into maximized pieces.
        if (measure > maxWidth) {
            // TODO - a divide and conquer method might be nicer.
            var edgewords = (function(word, maxWidth) {
                var wlen = word.length;
                if (wlen == 0) return [];
                if (wlen == 1) return [word];

                var awords = [], cword = "", cmeasure = 0, letters = [];

                // Measure each letter.
                for (var l = 0; l < wlen; l++)
                    letters.push({"letter":word[l], "measure":measureDiv.html(word[l]).width()});

                // Assemble the letters into words of maximized length.
                for (var ml in letters) {
                    var metaletter = letters[ml];

                    if (cmeasure + metaletter.measure > maxWidth) {
                        awords.push({ "word":cword, "len":cword.length, "measure":cmeasure });
                        cword = "";
                        cmeasure = 0;
                    }

                    cword += metaletter.letter;
                    cmeasure += metaletter.measure;
                }
                // there will always be one more word to push.
                awords.push({ "word":cword, "len":cword.length, "measure":cmeasure });
                return awords;
            })(word, maxWidth);

            // could use metawords = metawords.concat(edgwords)
            for (var ew in edgewords)
                metawords.push(edgewords[ew]);
        }
        else {
            metawords.push({ "word":word, "len":word.length, "measure":measure });
        }
    }

    // build array of lines second.
    var cline = "";
    var cmeasure = 0;
    for (var mw in metawords) {
        var metaword = metawords[mw];

        // If current word doesn't fit on current line, push the current line and start a new one.
        // Unless (edge-case): this is a new line and the current word is one character.
        if ((cmeasure + metaword.measure > maxWidth) && cmeasure > 0 && metaword.len > 1) {
            lines.push(cline)
            cline = "";
            cmeasure = 0;
        }

        cline += metaword.word;
        cmeasure += metaword.measure;

        // If there's room, append a space, else push the current line and start a new one.
        if (cmeasure + spacemeasure < maxWidth) {
            cline += " ";
            cmeasure += spacemeasure;
        } else {
            lines.push(cline)
            cline = "";
            cmeasure = 0;
        }
    }
    if (cmeasure > 0)
        lines.push(cline);

    return lines.join('\n');
} 
/*
 * For drawing in android and ipad
 */
$.fn.drawTouch = function() {
	
	var start = function(e) {
		e = e.originalEvent;
		var x = e.changedTouches[0].pageX - canvas.offsetLeft - xAdjust;
		var y = e.changedTouches[0].pageY - canvas.offsetTop - yAdjust;
		mouseDown(x,y);
		console.log("Draw adjust"+xAdjust);
		
	};
	var move = function(e) {
		e.preventDefault();
        e = e.originalEvent;
		var x = e.changedTouches[0].pageX - canvas.offsetLeft - xAdjust;
		var y = e.changedTouches[0].pageY - canvas.offsetTop - yAdjust;
		mousedown=1;
		
		mouseMove(x,y);
		console.log("Draw adjust"+xAdjust+' offsetleft : '+canvas.offsetLeft);
		
	};
	var end = function(e){
		e.preventDefault();
		mouseUp();
		
	}
	$(this).on("touchstart", start);
	$(this).on("touchmove", move);	
	$(this).on("touchend", end);

}

/*
 * For drawing in windows mobile
 */
$.fn.drawPointer = function() {
	var start = function(e) {
		e = e.originalEvent;
		var x = e.pageX - canvas.offsetLeft - xAdjust;
		var y = e.pageY - canvas.offsetTop - yAdjust;
		mouseDown(x,y);
	};
	var move = function(e) {
		e.preventDefault();
        e = e.originalEvent; 
		x = e.pageX - canvas.offsetLeft - xAdjust;
		y = e.pageY - canvas.offsetTop - yAdjust;
		mousedown=1;
		mouseMove(x,y);
		console.log("Draw adjust"+xAdjust+' offsetleft : '+canvas.offsetLeft);
		
    };
    var end = function(e){
		e.preventDefault();
		mouseUp();
	}
    $(this).on("MSPointerDown", start);
	$(this).on("MSPointerMove", move);
	$(this).on("MSPointerUp", end);
	
};
