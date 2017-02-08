/**
 * Created by zm on 2017/1/13.
 */
var _$ = {
    hasClass:function(elem, cls) {
        cls = cls || '';
        if (cls.replace(/\s/g, '').length == 0) return false;
        return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
    },
    addClass:function(ele, cls) {
        if (!this.hasClass(ele, cls)) {
            ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
        }
    },
    removeClass:function(ele, cls) {
        if (this.hasClass(ele, cls)) {
            var newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
            while (newClass.indexOf(' ' + cls + ' ') >= 0) {
                newClass = newClass.replace(' ' + cls + ' ', ' ');
            }
            ele.className = newClass.replace(/^\s+|\s+$/g, '');
        }
    }
};
var Chessboard = function () {
    this.boardInfo = {
        X : 20,
        Y : 20
    };
    this.iconInfo = {
        X:"",
        Y:"",
        //0,1,2,3分别代表下左上右
        face:0
    };
    this.obstacle = [];            //记录迷宫中的墙
    this.source = [];              //记录迷宫的寻路步骤
    this.findout = 0;              //循环迭代停止的信号，1意为找到目的地，退出迭代；
    this._init();
};

Chessboard.prototype = {
    _init: function () {
        this.table = document.querySelector("#table-bg");
        this.iconTarget = document.querySelector(".icon-target");
        this.input = document.querySelector("#text-input");
        this.submit = document.querySelector("#submit");
        this.rowNum = document.querySelector("#rowNum");
        this.reset = document.querySelector("#reset");
        this.build = document.querySelector("#build");
        this.remove = document.querySelector("#remove");
        this.input.value = "go\ntur lef\ntra rig 2 \nbuild\nmove to 2,5";
        this._rowChange();
        this._bind();
        this._createBoard();
        this._resetPosition();
    },
    _bind: function () {
        var that = this;
        this.input.addEventListener("keyup",function () {
            that._rowChange();
        });
        this.input.addEventListener("scroll",function () {
            that.rowNum.scrollTop = that.input.scrollTop;
        });
        this.submit.addEventListener("click",function () {
            for(var i = 0;i < that.rowNum.children.length;i++ ){
                _$.removeClass(that.rowNum.children[i],"success");
                _$.removeClass(that.rowNum.children[i],"warning");
                _$.removeClass(that.rowNum.children[i],"error");
            }
            that._readInput();
        });
        this.remove.addEventListener("click",function () {
            that.input.value = "";
            this._rowChange();
        });
        this.reset.addEventListener("click",function () {
            window.location.reload();
        });
        this.build.addEventListener("click",function () {
            that._buildMore();
        })
    },
    _createBoard: function () {
        var board = document.querySelector("#table-bg");
        var board_tr = [];
        for (var i = 0; i < this.boardInfo.X + 1; i++) {
            board_tr[i] = document.createElement("tr");
            board.appendChild(board_tr[i]);
            var board_td = [];
            for (var j = 0; j < this.boardInfo.Y + 1; j++) {
                board_td[j] = document.createElement("td");
                if (i == 0 && j != 0) {
                    board_td[j].innerText = j;
                }
                if (i != 0 && j == 0) {
                    board_td[j].innerText = i;
                }
                board_tr[i].appendChild(board_td[j]);
            }
        }
    },
    _resetPosition: function () {
        var positionX = Math.random() * this.boardInfo.X;
        var positionY = Math.random() * this.boardInfo.Y;
        this.iconInfo.X = Math.ceil(positionX);
        this.iconInfo.Y = Math.ceil(positionY);
        this.iconInfo.face = 0;
        this._renderPosition();
    },
    _renderPosition: function (direction,i) {
        var that = this;
        direction = direction || this.iconInfo.face;
        i = i || 0;
        this._success(i);
        this.iconTarget.style.left = this.iconInfo.X * 30.5 + "px";
        this.iconTarget.style.top = this.iconInfo.Y * 30.5 + "px";
        this.iconTarget.style.transform = "rotate(" + direction * 90 + "deg)";
        setTimeout(function () {
            if(that.iconInfo.face < 0 || that.iconInfo.face >3){
            that.iconInfo.face = that.iconInfo.face % 4 + (that.iconInfo.face % 4 < 0 ? 4 : 0);
            that.iconTarget.style.transition = "0s";
            that.iconTarget.style.transform = "rotate(" + that.iconInfo.face * 90 + "deg)";
            //如果不加异步，浏览器基本忽略 transition = 0;
            setTimeout(function () {
                that.iconTarget.style.transition = "0.5s";
            },400);
        }},400);
    },
    _go: function (direction,step,i) {   //指定方向，步数，textarea中的行数\
        if(!step) this._error(i);
        for(var j=0;j<step;j++){
            if(direction == 0 && this._canGo([this.iconInfo.X,this.iconInfo.Y+1],this.obstacle)){
                this.iconInfo.Y ++;
            }else if (direction == 1 && this._canGo([this.iconInfo.X-1,this.iconInfo.Y],this.obstacle)){
                this.iconInfo.X --;
            }else if (direction == 2 && this._canGo([this.iconInfo.X,this.iconInfo.Y-1],this.obstacle)){
                this.iconInfo.Y --;
            }else if(direction == 3 && this._canGo([this.iconInfo.X+1,this.iconInfo.Y],this.obstacle)){
                this.iconInfo.X ++;
            }else{
                this._warning(i);
            }
            this._renderPosition(this.iconInfo.face,i);
        }
    },
    _turnRight:function (i) {
        this.iconInfo.face--;
        this._renderPosition(this.iconInfo.face,i);
    },
    _turnLeft:function (i) {
        this.iconInfo.face++;
        this._renderPosition(this.iconInfo.face,i);

    },
    _turnBack:function (i) {
        this.iconInfo.face +=2;
        this._renderPosition(this.iconInfo.face,i);
    },
    _build:function (direction,i) {
        var x =this.iconInfo.X,
            y = this.iconInfo.Y;
        if(direction == 0 && y+1 <= this.boardInfo.Y){
            this.table.children[y+1].children[x].style.background = "#ccc";
            this.obstacle.push([x,y+1]);
        }else if (direction == 1 && x-1 > 0){
            this.table.children[y].children[x-1].style.background = "#ccc";
            this.obstacle.push([x-1,y]);
        }else if (direction == 2 && y > 0 ){
            this.table.children[y-1].children[x].style.background = "#ccc";
            this.obstacle.push([x,y-1]);
        }else if(direction == 3 && x+1 <= this.boardInfo.X){
            this.table.children[y].children[x+1].style.background = "#ccc";
            this.obstacle.push([x+1,y]);
        }else{
            this._warning(i);
            return;
        }
        this._success(i);
    },
    _buildMore:function () {
        for(var i=0;i<5;i++){
            var x = Math.ceil(Math.random() * this.boardInfo.X);
            var y = Math.ceil(Math.random() * this.boardInfo.Y);
            if(x == this.iconInfo.X && y == this.iconInfo.Y) continue;
            if(!this._canGo([x,y],this.obstacle)) continue;
            this.table.children[y].children[x].style.background = "#ccc";
            this.obstacle.push([x,y]);
        }
    },
    _move:function (target,i) {
        var that = this,
            current = [this.iconInfo.X,this.iconInfo.Y];
            j = 1;
        this.source = [];
        this.findout = 0;
        target = [parseInt(target[0]),parseInt(target[1])];
        if(target[0] == current[0] && target[1] == current[1]){
            this._success(i);
            return;
        }
        //如果目标是墙,gg
        if(!this._canGo(target,this.obstacle)){
            this._warning(i);
            return;
        }
        //创建一个数组，同时记录障碍和已走过的路；
        this.notGo = this.obstacle.slice();
        this.notGo.push(current);
        this._pathFinding(current,target);
        //如果找不到路，gg
        if(this.source.length == 0){
            this._warning(i);
            return;
        }
        this._go(this.source[0],1,i);
        var timer = setInterval(function () {
            if(j < that.source.length){
                that._go(that.source[j],1,i);
                j++;
            }else{
                clearInterval(timer);
            }
        },500);
    },


    //迷宫算法
    _pathFinding:function (current,target) {
        var road = this._judgeRoad(current,target);
        var newX,newY;
        for(var i=0;i<4;i++) {
            if(this.findout ==1) return;
            if(this._advance(current,road[i])){
                newX = current[0] + road[i][0];
                newY = current[1] + road[i][1];
                this.notGo.push([newX,newY]);                          //将现坐标填入notGo数组中
                this.source.push(road[i][2]);                         //将走动方向记录入source数组中
                if(newX == target[0] && newY == target[1]){
                    this.findout = 1;
                    return;
                }else{
                    this._pathFinding([newX,newY],target);
                }
            }
        }
        if(this.findout ==1) return;
        this.source.pop();
        this.notGo.pop();
    },
    _advance:function (current,arr) {           //判断此方向是否还有路可走
        var x = current[0],
            y = current[1];
        x += arr[0];
        y += arr[1];
        return this._canGo([x, y],this.notGo)
    },
    _judgeRoad:function (current,target) {           //通过判断目标与现在的位置，来选择一个相对可能近的路线方向,其中road数组中的值为[△x,△y,direction]
        var differX = target[0] - current[0],
            differY = target[1] - current[1];
        if (differX > 0 && differY > 0 ) {
            if(Math.abs(differX) > Math.abs(differY)){
                return [[1, 0, 3], [0, 1, 0], [-1, 0, 1], [0, -1, 2]];  //右下左上
            }else{
                return [[0, 1, 0], [1, 0, 3], [0, -1, 2], [-1, 0, 1]];  //下右上左
            }
        } else if (differX < 0 && differY > 0){
            if(Math.abs(differX) > Math.abs(differY)){
                return [[-1, 0, 1], [0, 1, 0], [1, 0, 3], [0, -1, 2]];  //左下右上
            }else{
                return [[0, 1, 0], [-1, 0, 1], [0, -1, 2], [1, 0, 3]];  //下左上右
            }
        } else if (differX > 0 && differY < 0){
            if(Math.abs(differX) > Math.abs(differY)){
                return [[1, 0, 3], [0, -1, 2], [-1, 0, 1], [0, 1, 0]];   //右上左下
            }else {
                return [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]];  //上右下左
            }
        } else if (differX <0 && differY < 0){
            if(Math.abs(differX) > Math.abs(differY)) {
                return [[-1, 0, 1], [0, -1, 2], [-1, 0, 1], [0, 1, 0]]; //左上右下
            }else{
                return [[0, -1, 2], [-1, 0, 1], [0, 1, 0], [1, 0, 3]];  //上左下右
            }
        } else if (differX == 0 && differY > 0){
            return [[0, 1, 0], [0, -1, 2], [-1, 0, 1],[1, 0, 3]];       //下上右左
        } else if (differX == 0 && differY < 0){
            return [[0, -1, 2], [0, 1, 0], [-1, 0, 1], [1, 0, 3]];       //上下右左
        } else if (differX > 0 && differY == 0){
            return [[1, 0, 3], [-1, 0, 1], [0, 1, 0], [0, -1, 2]];       //右左下上
        } else if (differX < 0 && differY == 0){
            return [[-1, 0, 1], [1, 0, 3], [0, 1, 0], [0, -1, 2]];       //左右下上
        }
    },




    _command: function (input,i) {
        input = input.toLowerCase().trim();
        // cmd,step,target 分别代表了 文字命令，移动格数，目标坐标
        var cmd,step,target;
        var num = input.replace(/[^0-9,]/g,"");
        var stepArray = num.split(",");
        if(stepArray[0] == ""){
            cmd = input;
            step = 1;
        }else if(stepArray[1]){
            cmd = input.replace(" "+ num ,"");
            target = stepArray;
        }else{
            cmd = input.replace(" "+ num ,"");
            step = stepArray[0];
        }
        switch (cmd){
            case "go":
                this._go(this.iconInfo.face,step,i);
                break;
            case "tur lef":
                this._turnLeft(i);
                break;
            case "tur rig":
                this._turnRight(i);
                break;
            case "tur bac":
                this._turnBack(i);
                break;
            case "mov lef":
                this.iconInfo.face = 1;
                this._go(this.iconInfo.face,step,i);
                break;
            case "mov rig":
                this.iconInfo.face = 3;
                this._go(this.iconInfo.face,step,i);
                break;
            case "mov top":
                this.iconInfo.face = 2;
                this._go(this.iconInfo.face,step,i);
                break;
            case "mov bot":
                this.iconInfo.face = 0;
                this._go(this.iconInfo.face,step,i);
                break;
            case "tra lef":
                this._go(1,step,i);
                break;
            case "tra rig":
                this._go(3,step,i);
                break;
            case "tra top":
                this._go(2,step,i);
                break;
            case "tra bot":
                this._go(0,step,i);
                break;
            case "build":
                this._build(this.iconInfo.face,i);
                break;
            case "build more":
                this._buildMore();
                break;
            case "move to":
                this._move(target,i);
                break;
            default:
                this._error(i)
        }
    },
    _rowChange:function () {
        var value = this.input.value.split("\n");
        var arr = [];
        for(var i =0; i < value.length; i++){
            arr.push("<div class='text-id'>" + (i+1) + "</div>");
        }
        this.rowNum.innerHTML = arr.join("\n");
        this.rowNum.scrollTop = this.input.scrollTop;
    },
    _readInput:function () {                    //读入textarea中输入的命令
        var that = this;
        var value = this.input.value;
        var valueArray = value.split("\n");
        var i = 1;
        if(!value) return;
        that._command(valueArray[0],0);
        var timer = setInterval(function () {
            if(i < valueArray.length ){
                that._command(valueArray[i],i);
                i++;
            }else{
                clearTimeout(timer);
            }
        },1000);
    },
    _canGo:function(positon,obstacle){   //判断target能否往前走
        if( positon[0]<1 || positon[1]<1 || positon[0]>this.boardInfo.X || positon[1]>this.boardInfo.Y) return false;
        for(var i=0;i<obstacle.length;i++){
            if(obstacle[i].toString() == positon.toString()){
                return false;
            }
        }
        return true;
    },
    _success:function (i) {
        var list = this.rowNum.children;
        if(!list.length) return;
        if(i > 0){
            _$.removeClass(list[i-1],"success");
        }
            _$.addClass(list[i],"success");
    },
    _warning:function (i) {
        if( i > 0 ) _$.removeClass(this.rowNum.children[i-1],"success");
        _$.addClass(this.rowNum.children[i],"warning");
        throw new Error("can't go there!");
    },
    _error:function (i) {
        if( i > 0 ) _$.removeClass(this.rowNum.children[i-1],"success");
        _$.addClass(this.rowNum.children[i],"error");
        throw new Error("please input correct code!");
    }
};

new Chessboard();



