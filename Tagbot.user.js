// ==UserScript==
// @name          Random Bot things
// @description   Some useful functions to get you started. On the bottom you'll find the way I interpret the desired location and convert that to keypresses.
// @include               http://tagpro-maptest.koalabeast.com:*
// @include       http://*.jukejuice.com:*
// @include       http://*.newcompte.fr:*
// @include       http://justletme.be:*
// @require       https://s3.amazonaws.com/easystar/easystar-0.1.8.min.js
// @author        D'n Pilzer
// @version       1.0
// ==/UserScript==
tagpro.ready(function(){
    
    /*var easystar = new EasyStar.js();
var grid = [[0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,0,0,0]];
easystar.setGrid(grid);
easystar.setAcceptableTiles([0]);
easystar.findPath(0, 0, 4, 0, function( path ) {
    if (path === null) {
        alert("Path was not found.");
    } else {
        alert("Path was found. The first Point is " + path[0].x + " " + path[0].y);
    }
});
console.log("asfd");
*/
    ////////////////////////////////////////////////////////////////// Code below handles chat and name setting
    var lastMessage = 0;
    
    function chat_team(chatMessage) {
        var limit = 500 + 10;
        var now = new Date();
        var timeDiff = now - lastMessage;
        if (timeDiff > limit) {
            tagpro.socket.emit("chat", {
                message: chatMessage,
                toAll: 0
            });
            lastMessage = new Date();
        } else if (timeDiff >= 0) {
            setTimeout(chat, limit - timeDiff, chatMessage);
        }
            }
    
    function chat_all(chatMessage) {
        var limit = 500 + 10;
        var now = new Date();
        var timeDiff = now - lastMessage;
        if (timeDiff > limit) {
            tagpro.socket.emit("chat", {
                message: chatMessage,
                toAll: 1
            });
            lastMessage = new Date();
        } else if (timeDiff >= 0) {
            setTimeout(chat_all, limit - timeDiff, chatMessage);
        }
            }
    
    
    ///////////////////////////////////////////////////// Code below handles getting player objects
    
    function self(){
        return tagpro.players[tagpro.playerId];
    }
    
    
    //finds enemy fc
    function enemy_fc(){
        for (var t in tagpro.players) {
            var r = tagpro.players[t];
            if (r.flag && r.team != self().team) {
                return r;
            }
        }
        return null;
    }
    
    function our_fc(){
        for (var t in tagpro.players) {
            var r = tagpro.players[t];
            if (r.flag && r.team == self().team) {
                return r;
            }
        }
        return null;
    }
    
    function type_of(tile){
        switch (tile) { //red == 1, blue == 2
            case 0: return "floor"; break;          //black
            case 1: return "wall"; break;           //wall
            case 2: return "floor"; break;          //tile
            case 3: return "floor"; break;          //flag1
            case "3.1": return "floor"; break;              //flag1 taken
            case 4: return "floor"; break;          //flag2
            case "4.1": return "floor"; break;              //flag2 taken
            case 5: return "boost"; break; //also boost?
            case 5.1: return "floor"; break; //used boost
            case 6: return "floor"; break;          //powerup gone
            case 6.1: return "powerup"; break;      //JJ
            case 6.2: return "powerup"; break;      //RB
            case 6.3: return "powerup"; break;      //TP
            case "6.4": return "powerup"; break;    //Speed
            case 7: return "spike"; break;          //spike
            case 8: return "button"; break;         //button
            case "8.1": return "floor"; break;              //button held
            case 9: return "floor"; break;          //tiles that can be red/blue/green wall is grey
            case 9.1: return "spike"; break;                //tiles that can be red/blue/green wall is green
            case 9.2: if (self.team == 1) return "floor"; else return "spike"; break;               //tiles that can be red/blue/green wall is red
            case 9.3: if (self.team == 2) return "floor"; else return "spike"; break;               //tiles that can be red/blue/green wall is blue
            case 10: return "boost"; break;         //boost
            case 11: return "floor"; break;         //red tiles
            case 12: return "floor"; break;         //blue tiles
            case 13: return "floor"; break;         //portal
            case 14: if (self.team == 1) return "boost"; else return "floor"; break; //red boost
            case 14.1: return "floor"; //used red boost
            case 15: if (self.team == 2) return "boost"; else return "floor"; break; //blue boost
            case 15.1: return "floor"; //used blue boost
            case 16:  return "floor"; break;                //centerflag
            case "16.1":  return "floor"; break;    //cf taken
            case 17: return "floor"; break; //red endzone
            case 18: return "floor"; break; //blue endzone
        }
        if (Math.floor(tile) == 1) return "wall";
        console.log("unknown value tile: "+ tile);
        return "unknown";
    }
    
    
    //////////////////////////////////////////////////////Finding flags
    function find_our_flag(){
        //I have to know what team I am to know what flag I have to defend/attack
        var flagval = self().team + 2;
        for (column in tagpro.map) {
            for (tile in tagpro.map[column]) {
                if (tagpro.map[column][tile] == flagval || tagpro.map[column][tile] == flagval+0.1) {
                    return {x:(40 * column),y:(40 * tile)};
                }
            }
        }
        return null;
    }
    
    function find_their_flag(){
        var flagval = (self().team + 2 == 4) ? 3 : 4;
        for (column in tagpro.map) {
            for (tile in tagpro.map[column]) {
                if (tagpro.map[column][tile] == flagval || tagpro.map[column][tile] == flagval+0.1) {
                    return {x:(40 * column),y:(40 * tile)};
                }
            }
        }
        return null;
    }
    
    
    
    
    
    
    
    //////////////////////////////////////////////////// Code below handles buttonpresses
    var ai_goal = {x: 0.0, y: 0.0};
    var held_buttons = [];
    var interval = 50;
    
    //this makes shit readable later, promise
    function ai_goLeft(){ ai_releaseRight(); ai_pressLeft();}
    function ai_pressLeft(){ ai_press(37); }
    function ai_releaseLeft(){ ai_release(37);}
    
    function ai_goUp(){ ai_releaseDown(); ai_pressUp();}
    function ai_pressUp(){ ai_press(38); } 
    function ai_releaseUp(){ ai_release(38);}
    
    function ai_goRight(){ ai_releaseLeft(); ai_pressRight();}
    function ai_pressRight(){ ai_press(39); }
    function ai_releaseRight(){ ai_release(39);}
    
    function ai_goDown(){ ai_releaseUp(); ai_pressDown();}
    function ai_pressDown(){ ai_press(40); }
    function ai_releaseDown(){ ai_release(40);}
    
    function ai_releaseAll(){ ai_releaseDown(); ai_releaseUp(); ai_releaseLeft(); ai_releaseRight();}
    
    //safe release and press button methods
    function ai_press(kc){
        //don't press a pressed button
        if(held_buttons.indexOf(kc) > -1){
            return;
        }
        
        held_buttons.push(kc);
        var e = jQuery.Event("keydown");
        e.keyCode = kc;
        jQuery("canvas").trigger(e);
        
        var timenow = new Date();
        //console.log(timenow+":    button "+kc+" down");
    }
    
    function ai_release(kc){
        //don't release a button that isn't pressed
        if(held_buttons.indexOf(kc) < 0){
            return;
        }
        
        held_buttons.splice(held_buttons.indexOf(kc),1);
        var e = jQuery.Event("keyup");
        e.keyCode = kc;
        jQuery("canvas").trigger(e);
        var timenow = new Date();
        //console.log(timenow+":    button "+kc+" up");
    }
    
    var bot = true;
    var prev_absx = 0;
    var prev_absy = 0;
    function ai_goal_loop(){
        if (bot){
            
            //one axis is only held down a percent of the time(average)
            var percent = 0;
            
            //get absolute values to make things cleaner later
            var absy = Math.abs(ai_goal.y);
            var absx = Math.abs(ai_goal.x);
            
            //If I'm closer than 20px, I want to go the same direction as before, so I don't change buttons all the time
            if (absx*absx+absy*absy < 20*20){
                absx = prev_absx;
                absy = prev_absy;
            }
            else {
                prev_absx = absx;
                prev_absy = absy;
            }
            
            
            //get the percent press of the smaller number
            percent = absy > absx ? (interval*absx/absy) : (interval*absy/absx);
            //console.log(percent/interval);
            
            if (Math.sqrt((Math.pow(absx,2)+Math.pow(absy,2)))<1){
                //chat("close");
                ai_releaseAll()
            }
            else if(absx > absy){//case where x is greater
                ai_goal.x > 0 ? ai_goRight() : ai_goLeft();
                ai_releaseUp();
                ai_releaseDown();
                if (percent/interval > 0.1) (ai_goal.y < 0) ? setTimeout(ai_goUp, interval-percent) : setTimeout(ai_goDown, interval-percent);
            }
                else
            {
                ai_goal.y < 0 ? ai_goUp() : ai_goDown();
                ai_releaseLeft();
                ai_releaseRight();
                if (percent/interval > 0.1) (ai_goal.x > 0) ? setTimeout(ai_goRight, interval-percent) : setTimeout(ai_goLeft, interval-percent);
            }
        }
    }
    
    
    
    function brake(x,y,streckex,streckey,Svenangle)
    {
        if ( streckex >= Math.abs(x - self().x))
        {
            console.log("brakex");
            if (x > self().x && Math.abs(self().ly)/Math.abs(self().lx) > Svenangle )
            {
                
                if( Math.abs(x - tagpro.players[tagpro.playerId].x) >  Math.abs(y - tagpro.players[tagpro.playerId].y))
                {
                    ai_releaseUp();
                    ai_releaseDown();
                }
                ai_goLeft();
            }
            if (x < self().x && Math.abs(self().ly)/Math.abs(self().lx) > Svenangle)
            {
                if( Math.abs(x - tagpro.players[tagpro.playerId].x) >  Math.abs(y - tagpro.players[tagpro.playerId].y))
                {
                    ai_releaseDown();
                    ai_releaseUp();
                }
                ai_goRight();
            }
        }
        if ( streckey >= Math.abs(y - self().y))
        {
            console.log("brakey");
            if (y < self().y && Math.abs(self().ly)/Math.abs(self().lx) < Svenangle)
            {
                if( Math.abs(x - tagpro.players[tagpro.playerId].x) <  Math.abs(y - tagpro.players[tagpro.playerId].y))
                {
                    ai_releaseLeft();
                    ai_releaseRight();
                }
                ai_goDown();
            }
            if (y > self().y && Math.abs(self().ly)/Math.abs(self().lx) < Svenangle)
            {
                if( Math.abs(x - tagpro.players[tagpro.playerId].x) <  Math.abs(y - tagpro.players[tagpro.playerId].y))
                {
                    ai_releaseLeft();
                    ai_releaseRight();
                }
                ai_goUp();
            }
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    function ai_goto(x,y,v){
        /* if((self().lx == 0 || self().ly == 0) && self().dead != true)
        {
            
            ai_pressUp();
            ai_pressDown();
            ai_pressLeft();
            ai_pressRight();
            ai_releaseUp();
            ai_releaseDown();
            ai_releaseLeft();
            ai_releaseRight();   
        }
        */
        
        if (x == tagpro.players[tagpro.playerId].x && y == tagpro.players[tagpro.playerId].y && self().up != false && self().down != false && self().right != false && self().left != false)
        {
            ai_releaseUp();
            ai_releaseDown();
            ai_releaseLeft();
            ai_releaseRight();
        }
        if (x != tagpro.players[tagpro.playerId].x && y != tagpro.players[tagpro.playerId].y)
        {
            Svenangle = Math.abs(y-tagpro.players[tagpro.playerId].y) / Math.abs(x-tagpro.players[tagpro.playerId].x);
            
            var timey = (Math.abs(self().ly )* 0.025 );
            var timex = (Math.abs(self().lx )* 0.025 );
            var streckey = 0.5 * 0.025 * (timey * timey);
            var streckex = 0.5 * 0.025 * (timex * timex);
            
            
            
            if ( streckex < Math.abs(x - self().x))
            {
                if (x > self().x && Math.abs(self().ly)/Math.abs(self().lx) > Svenangle )
                {
                    if( Math.abs(x - tagpro.players[tagpro.playerId].x) >  Math.abs(y - tagpro.players[tagpro.playerId].y))
                    {
                        ai_releaseUp();
                        ai_releaseDown();
                    }
                    ai_goRight();
                }
                if (x < self().x && Math.abs(self().ly)/Math.abs(self().lx) > Svenangle)
                {
                    if( Math.abs(x - tagpro.players[tagpro.playerId].x) >  Math.abs(y - tagpro.players[tagpro.playerId].y))
                    {
                        ai_releaseDown();
                        ai_releaseUp();
                    }
                    ai_goLeft();
                }
            }
            if ( streckey < Math.abs(y - self().y))
            {
                if (y < self().y && Math.abs(self().ly)/Math.abs(self().lx) < Svenangle)
                {
                    if( Math.abs(x - tagpro.players[tagpro.playerId].x) <  Math.abs(y - tagpro.players[tagpro.playerId].y))
                    {
                        ai_releaseLeft();
                        ai_releaseRight();
                    }
                    ai_goUp();
                }
                if (y > self().y && Math.abs(self().ly)/Math.abs(self().lx) < Svenangle)
                {
                    if( Math.abs(x - tagpro.players[tagpro.playerId].x) <  Math.abs(y - tagpro.players[tagpro.playerId].y))
                    {
                        ai_releaseLeft();
                        ai_releaseRight();
                    }
                    ai_goDown();
                    
                }
            }
            brake(x,y,streckex,streckey,Svenangle);
        }
    }
    
    setInterval(function(){ai_goto( 471,347,12);}, 30);
});
