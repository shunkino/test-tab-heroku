"use strict"
angular.module('starter.controllers',['ui.bootstrap','ionic','ionic.contrib.frostedGlass','ngAnimate','ngTouch'])
//----------------
//--DashCtrl------
//----------------
.controller('DashCtrl', function($scope,TennisID,socket,$ionicFrostedDelegate,$ionicScrollDelegate,$ionicPopup,$cordovaGoogleAnalytics) {
    var id;
    var tennisdata = TennisID.all();
    
    $scope.setChoice = "1";
    $scope.gameChoice = "6";
    $scope.gametype =  "1";
    $scope.modeChoice = "1";
    $scope.agtiebreak = true;
    $scope.agdeuce = true;
    $scope.player1 = "Player1";
    $scope.player2 = "Player2";

    $scope.choseType = function(){
      if($scope.gametype == "1"){
        $scope.daubles = false;
        $scope.player1 = "Player1";
        $scope.player2 = "Player2";
      }else{
        $scope.daubles = true;
        $scope.player1 = "フォアサイドPlayer1";
        $scope.player2 = "フォアサイドplayer2";
        $scope.player3 = "バックサイドPlayer1";
        $scope.player4 = "バックサイドplayer2";
      }
    }

    $scope.gamestartclick = function(){
      var creater = $scope.agcreater,
          player1 = $scope.agplayer1,
          player2 = $scope.agplayer2,
          player3 = $scope.agplayer3,
          player4 = $scope.agplayer4,
          set = $scope.setChoice,
          game = $scope.gameChoice,
          tiebreak = $scope.agtiebreak,
          deuce = $scope.agdeuce;
      if($scope.gametype == "1"){
		  //シングルス
        if(creater == null || player1== null || player2== null){
          var alertPopup = $ionicPopup.alert({
            title:"名前を入力してください。"
          });
        }else{
          var confirmPopup = $ionicPopup.confirm({
            title:"試合データを作成しますか？",
            template:"試合データが作成された場合、リアルタイムに試合状況が配信されます。"
        });
          confirmPopup.then(function(res){
            if(res){
              tennisdata.creater = creater;
              tennisdata.player1 = player1;
              tennisdata.player2 = player2;
              tennisdata.gametype = "1";
              tennisdata.set = set;
              tennisdata.game = game;
              tennisdata.tiebreak = tiebreak;
              tennisdata.deuce = deuce;
              tennisdata.starttime = Date.now();
              socket.emit("tennis-start",{tennis:tennisdata});
            }
          });
        }
      }else{
		  //ダブルス
        if(creater == null || player1== null || player2== null || player3==null ||player4 == null){
          var alertPopup = $ionicPopup.alert({
            title:"名前を入力してください。"
          });
        }else{
          var confirmPopup = $ionicPopup.confirm({
            title:"試合データを作成しますか？",
            template:"試合データが作成された場合、リアルタイムに試合状況が配信されます。"
          });
          confirmPopup.then(function(res){
            if(res){
              tennisdata.realtime = true;
              tennisdata.creater = creater;
              tennisdata.player1 = player1;
              tennisdata.player2 = player2;
              tennisdata.player3 = player3;
              tennisdata.player4 = player4;
              tennisdata.gametype = "2";
              tennisdata.set = set;
              tennisdata.game = game;
              tennisdata.tiebreak = tiebreak;
              tennisdata.deuce = deuce;
              tennisdata.starttime=Date.now();
              socket.emit("tennis-start",{tennis:tennisdata});
            } 
          });
        }
      }
    }
       socket.on("tennis-start",function(data){
        tennisdata.ID = data._id;
        console.log(tennisdata);
        if($scope.modeChoice==0)location.href = "#/tab/dash/easyscoreboard/" + tennisdata.ID;
        else if($scope.modeChoice==1)location.href = "#/tab/dash/scoreboard/" + tennisdata.ID;
		// IDでURLを分けない場合
        //if($scope.modeChoice==0)location.href = "#/tab/dash/easyscoreboard";
        //else if($scope.modeChoice==1)location.href = "#/tab/dash/scoreboard";
    });
})

//----------------
//--scoreboardCtrl----------------------------------------------------------------
//----------------------
.controller('scoreboardCtrl',function($scope,TennisID,$ionicPopup,socket,$rootScope,$stateParams){
	if (TennisID.all()["ID"] == null) {
		console.log("resumed but ID is no defined.");	
		//IDを元にテニスの情報を持ってくる
		socket.emit('resume-game', $stateParams.id);
		//取得した情報をコールバックで受け取る。socket使わないもっとうまい方法あるかも。
		socket.on('resume-success', function(tennisInstance){
			TennisID.set(tennisInstance.startdata);
			console.log(TennisID.all());
		});
	} else {
		//IDがバインドされている場合は必ず新規
		//do nothing.
		console.log("you made a new game.")	
	}
    //---------変数設定--------------------------------------------------------------
    //
    /*$scope.$on('$ionicView.beforeLeave',function(){
    });*/
    var tennisdata = TennisID.all();
    var setpoint1=0,setpoint2=0,gamepoint1=0,gamepoint2=0,point1=0,point2=0;
    var winner="途中で終了しました。";
    var isTiebreak = false,
        foreback = 0,//0=fore,1=back
        faultcount=0,//0=fault,1=double fault
        isStroke=0;//0=stroke,1=bolay

    var isGameSet = false;


    var player1=TennisID.all().player1,
        player2=TennisID.all().player2,
        player3=TennisID.all().player3,
        player4=TennisID.all().player4,
        creater=TennisID.all().creater,
        gametype=TennisID.all().gametype,
        setcount=TennisID.all().set,
        gamecount=TennisID.all().game;

    var Nserverchange = 0,
        Nreceiverchange = 0;
    var serverchange2 = 0;

    var isside = 0;//0=fore 1=back hand

    var numaction = 0;
//--------データ用変数の定義-----------------------------------------------------------------
var pointdata1 = new Array(0,0,0,0,0,0,0,0,0,0,0),
        serverside1 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
        returnside1 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
        shotdata1 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
var pointdata2 = new Array(0,0,0,0,0,0,0,0,0,0,0),
        serverside2 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
        returnside2 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),
      shotdata2 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
var pointtext = new Array("0","0","0","0","0","0");
var pointtext2 = new Array(0,0,0,0,0,0);
var server = new Array("●","");
var ActionTennis = new Array();
var gamecountsave = new Array(),
    numgamecount = 0;
//---------初期設定--------------------------------------------------------------------------
    $scope.agcreater = creater;
    $scope.agserver1 = TennisID.all().player1;
    $scope.agreceiver1 = TennisID.all().player1;
    $scope.agserver2 = TennisID.all().player2;
    $scope.agreceiver2 = TennisID.all().player2;
    if(gametype == "1"){
      $scope.agplayer1 = player1;
      $scope.agplayer2 = player2;
    }else{
      $scope.agplayer1 = player1+" & "+player3;
      $scope.agplayer2 = player2+" & "+player4;
    }
    $scope.agset1 = setpoint1;
    $scope.aggame1 = gamepoint1;
    $scope.agpoint1 = point1;
    $scope.agset2 = setpoint2;
    $scope.aggame2 = gamepoint2;
    $scope.agpoint2 = point2;
    $scope.serverbutton1 = true;
    $scope.checkserver1 = true;
    $scope.faultbutton1 = true;
    $scope.strokebutton1 = true;
    $scope.strokebutton2 = true;
    $scope.checkserver11 = true;
    $scope.checkreceiver22 = true;
    //-------player1ボタンクリック挙動------------------------------------------------
$scope.servicein1 = function(){
  ForeBack();
  displayReceiver();
  if(foreback == 0){
    if(faultcount==0){
      serverside1[0]++;
      serverside1[12]++;
    }else if(faultcount==1){
      serverside1[2]++;
      serverside1[13]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      serverside1[1]++;
      serverside1[14]++;
    }else if(faultcount==1){
      serverside1[3]++;
      serverside1[15]++;
    }
  }
  isStroke=0;
}
$scope.serviceace1 = function(){
  ForeBack();
  point1++;
  displayServer();
  ClickPoint(1,point1);
  if(foreback == 0){
    if(faultcount==0){
      serverside1[0]++;
      serverside1[4]++;
      serverside1[12]++;
      pointdata1[0]++;
      pointdata1[3]++;
    }else if(faultcount==1){
      serverside1[2]++;
      serverside1[6]++;
      serverside1[13]++;
      pointdata1[0]++;
      pointdata1[5]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      serverside1[1]++;
      serverside1[5]++;
      serverside1[14]++;
      pointdata1[0]++;
      pointdata1[4]++;
    }else if(faultcount==1){
      serverside1[3]++;
      serverside1[7]++;
      serverside1[15]++;
      pointdata1[0]++;
      pointdata1[6]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.fault1 = function(){
  ForeBack();
  $scope.faultbutton1=false;
  $scope.doublefaultbutton1=true;
  if(foreback==0){
    serverside1[8]++;
    serverside1[12]++;
  }else if(foreback==1){
    serverside1[9]++;
    serverside1[14]++;
  }
  faultcount=1;
}
$scope.doublefault1 = function(){
  ForeBack();
  point2++;
  displayServer();
  ClickPoint(2,point2);
  if(foreback==0){
    serverside1[10]++;
    serverside1[13]++;
    pointdata2[0]++;
  }else if(foreback==1){
    serverside1[11]++;
    serverside1[15]++;
    pointdata2[0]++;
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.returnin1 = function(){
  ForeBack();
  ConfirmSide();
  displayType(5);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside1[0]++;
        returnside1[24]++;
      }else if(isside==1){
        returnside1[20]++;
        returnside1[25]++;
      }
    }else if(faultcount==1){
      if(isside==0){
        returnside1[2]++;
        returnside1[26]++;
      }else if(isside==1){
        returnside1[22]++;
        returnside1[27]++;
      }
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside1[1]++;
        returnside1[28]++;
      }else if(isside==1){
        returnside1[21]++;
        returnside1[29]++;
      }
    }else if(faultcount==1){
      if(isside==0){
        returnside1[3]++;
        returnside1[30]++;
      }else if(isside==1){
        returnside1[23]++;
        returnside1[31]++;
      }
    }
  }
  isStroke=0;
}
$scope.returnace1 = function(){
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  ClickPoint(1,point1);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside1[4]++;
        returnside1[24]++;
        pointdata1[1]++;
      }else if(isside==1){
        returnside1[5]++;
        returnside1[25]++;
        pointdata1[2]++;
      }
      pointdata1[0]++;
      pointdata1[7]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside1[8]++;
        returnside1[26]++;
        pointdata1[1]++;
      }else if(isside==1){
        returnside1[9]++;
        returnside1[27]++;
        pointdata1[2]++;
      }
      pointdata1[0]++;
      pointdata1[9]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside1[6]++;
        retunrside1[28]++;
        pointdata1[1]++;
      }else if(isside==1){
        returnside1[7]++;
        returnside1[29]++;
        pointdata1[2]++;
      }
      pointdata1[0]++;
      pointdata1[8]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside1[10]++;
        returnside1[30]++;
        pointdata1[1]++;
      }else if(isside==1){
        returnside1[11]++;
        returnside1[31]++;
        pointdata1[2]++;
      }
      pointdata1[0]++;
      pointdata1[10]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.returnmiss1 = function(){  
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  ClickPoint(2,point2);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside1[12]++;
        returnside1[24]++;
      }else if(isside==1){
        returnside1[14]++;
        returnside1[25]++;
      }
      pointdata2[0]++;
      pointdata2[3]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside1[16]++;
        returnside1[26]++;
      }else if(isside==1){
        returnside1[18]++;
        returnside1[27]++;
      }
      pointdata2[0]++;
      pointdata2[5]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside1[13]++;
        returnside1[28]++;
      }else if(isside==1){
        returnside1[15]++;
        returnside1[29]++;
      }
      pointdata2[0]++;
      pointdata2[4]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside1[17]++;
        returnside1[30]++;
      }else if(isside==1){
        returnside1[19]++;
        returnside1[31]++;
      }
      pointdata2[0]++;
      pointdata2[6]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.win1 = function(){  
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[3]++;
      }else if(faultcount==1){
        pointdata1[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[4]++;
      }else if(faultcount==1){
        pointdata1[6]++;
      }
    }
    pointdata1[0]++;
  }else if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[7]++;
      }else if(faultcount==1){
        pointdata1[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[8]++;
      }else if(faultcount==1){
        pointdata1[10]++;
      }
    }
    pointdata1[0]++;
  }
  ClickPoint(1,point1);
  if(isStroke==0){
    if(isside==0){
      shotdata1[0]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata1[1]++;
      pointdata1[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata1[8]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata1[9]++;
      pointdata1[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.side1 = function(){  
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[3]++;
      }else if(faultcount==1){
        pointdata2[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[4]++;
      }else if(faultcount==1){
        pointdata2[6]++;
      }
    }
    pointdata2[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[7]++;
      }else if(faultcount==1){
        pointdata2[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[8]++;
      }else if(faultcount==1){
        pointdata2[10]++;
      }
    }
    pointdata2[0]++;
  }
  ClickPoint(2,point2);
  if(isStroke==0){
    if(isside==0){
      shotdata1[2]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[3]++;
      pointdata2[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata1[10]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[11]++;
      pointdata2[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.back1 = function(){  
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[3]++;
      }else if(faultcount==1){
        pointdata2[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[4]++;
      }else if(faultcount==1){
        pointdata2[6]++;
      }
    }
    pointdata2[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[7]++;
      }else if(faultcount==1){
        pointdata2[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[8]++;
      }else if(faultcount==1){
        pointdata2[10]++;
      }
    }
    pointdata2[0]++;
  }
  ClickPoint(2,point2);
  if(isStroke==0){
    if(isside==0){
      shotdata1[4]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[5]++;
      pointdata2[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata1[12]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[13]++;
      pointdata2[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.net1 = function(){  
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[3]++;
      }else if(faultcount==1){
        pointdata2[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[4]++;
      }else if(faultcount==1){
        pointdata2[6]++;
      }
    }
    pointdata2[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[7]++;
      }else if(faultcount==1){
        pointdata2[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[8]++;
      }else if(faultcount==1){
        pointdata2[10]++;
      }
    }
    pointdata2[0]++;
  }
  ClickPoint(2,point2);
  if(isStroke==0){
    if(isside==0){
      shotdata1[6]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[7]++;
      pointdata2[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata1[14]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[15]++;
      pointdata2[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.unerror1 = function(){
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[3]++;
      }else if(faultcount==1){
        pointdata2[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[4]++;
      }else if(faultcount==1){
        pointdata2[6]++;
      }
    }
    pointdata2[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[7]++;
      }else if(faultcount==1){
        pointdata2[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[8]++;
      }else if(faultcount==1){
        pointdata2[10]++;
      }
    }
    pointdata2[0]++;
  }
  ClickPoint(2,point2);
  if(isStroke==0){
    if(isside==0){
      shotdata1[16]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[17]++;
      pointdata2[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata1[18]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata1[19]++;
      pointdata2[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
//-------player2ボタンクリック挙動------------------------------------------------
$scope.servicein2 = function(){
  ForeBack();
  displayReceiver();
  if(foreback == 0){
    if(faultcount==0){
      serverside2[0]++;
      serverside2[12]++;
    }else if(faultcount==1){
      serverside2[2]++;
      serverside2[13]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      serverside2[1]++;
      serverside2[14]++;
    }else if(faultcount==1){
      serverside2[3]++;
      serverside2[15]++;
    }
  }
  isStroke=0;
}
$scope.serviceace2 = function(){  
  ForeBack();
  point2++;
  displayServer();
  ClickPoint(2,point2);
  if(foreback == 0){
    if(faultcount==0){
      serverside2[0]++;
      serverside2[4]++;
      serverside2[12]++;
      pointdata2[0]++;
      pointdata2[3]++;
    }else if(faultcount==1){
      serverside2[2]++;
      serverside2[6]++;
      serverside2[13]++;
      pointdata2[0]++;
      pointdata2[5]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      serverside2[1]++;
      serverside2[5]++;
      serverside2[14]++;
      pointdata2[0]++;
      pointdata2[4]++;
    }else if(faultcount==1){
      serverside2[3]++;
      serverside2[7]++;
      serverside2[15]++;
      pointdata2[0]++;
      pointdata2[6]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.fault2 = function(){  
  ForeBack();
  $scope.faultbutton2=false;
  $scope.doublefaultbutton2=true;
  if(foreback==0){
    serverside2[8]++;
    serverside2[12]++;
  }else if(foreback==1){
    serverside2[9]++;
    serverside2[14]++;
  }
  faultcount=1;
}
$scope.doublefault2 = function(){
  ForeBack();
  point1++;
  displayServer();
  ClickPoint(1,point1);
  if(foreback==0){
    serverside2[10]++;
    serverside2[13]++;
    pointdata1[0]++;
  }else if(foreback==1){
    serverside2[11]++;
    serverside2[15]++;
    pointdata1[0]++;
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.returnin2 = function(){  
  ForeBack();
  ConfirmSide();
  displayType(5);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside2[0]++;
        returnside2[24]++;
      }else if(isside==1){
        returnside2[20]++;
        returnside2[25]++;
      }
    }else if(faultcount==1){
      if(isside==0){
        returnside2[2]++;
        returnside2[26]++;
      }else if(isside==1){
        returnside2[22]++;
        returnside2[27]++;
      }
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside2[1]++;
        returnside2[28]++;
      }else if(isside==1){
        returnside2[21]++;
        returnside2[29]++;
      }
    }else if(faultcount==1){
      if(isside==0){
        returnside2[3]++;
        returnside2[30]++;
      }else if(isside==1){
        returnside2[23]++;
        returnside2[31]++;
      }
    }
  }
  isStroke=0;
}
$scope.returnace2 = function(){
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  ClickPoint(2,point2);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside2[4]++;
        returnside2[24]++;
        pointdata2[1]++;
      }else if(isside==1){
        returnside2[5]++;
        returnside2[25]++;
        pointdata2[2]++;
      }
      pointdata2[0]++;
      pointdata2[7]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside2[8]++;
        returnside2[26]++;
        pointdata2[1]++;
      }else if(isside==1){
        returnside2[9]++;
        returnside2[27]++;
        pointdata2[2]++;
      }
      pointdata2[0]++;
      pointdata2[9]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside2[6]++;
        retunrside1[28]++;
        pointdata2[1]++;
      }else if(isside==1){
        returnside2[7]++;
        returnside2[29]++;
        pointdata2[2]++;
      }
      pointdata2[0]++;
      pointdata2[8]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside2[10]++;
        returnside2[30]++;
        pointdata2[1]++;
      }else if(isside==1){
        returnside2[11]++;
        returnside2[31]++;
        pointdata2[2]++;
      }
      pointdata2[0]++;
      pointdata2[10]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.returnmiss2 = function(){
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  ClickPoint(1,point1);
  if(foreback==0){
    if(faultcount==0){
      if(isside==0){
        returnside2[12]++;
        returnside2[24]++;
      }else if(isside==1){
        returnside2[14]++;
        returnside2[25]++;
      }
      pointdata1[0]++;
      pointdata1[3]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside2[16]++;
        returnside2[26]++;
      }else if(isside==1){
        returnside2[18]++;
        returnside2[27]++;
      }
      pointdata1[0]++;
      pointdata1[5]++;
    }
  }else if(foreback==1){
    if(faultcount==0){
      if(isside==0){
        returnside2[13]++;
        returnside2[28]++;
      }else if(isside==1){
        returnside2[15]++;
        returnside2[29]++;
      }
      pointdata1[0]++;
      pointdata1[4]++;
    }else if(faultcount==1){
      if(isside==0){
        returnside2[17]++;
        returnside2[30]++;
      }else if(isside==1){
        returnside2[19]++;
        returnside2[31]++;
      }
      pointdata1[0]++;
      pointdata1[6]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.win2 = function(){  
  ForeBack();
  ConfirmSide();
  point2++;
  displayServer();
  if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[3]++;
      }else if(faultcount==1){
        pointdata2[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[4]++;
      }else if(faultcount==1){
        pointdata2[6]++;
      }
    }
    pointdata2[0]++;
  }else if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata2[7]++;
      }else if(faultcount==1){
        pointdata2[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata2[8]++;
      }else if(faultcount==1){
        pointdata2[10]++;
      }
    }
    pointdata2[0]++;
  }
  ClickPoint(2,point2);
  if(isStroke==0){
    if(isside==0){
      shotdata2[0]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata2[1]++;
      pointdata2[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata2[8]++;
      pointdata2[1]++;
    }else if(isside==1){
      shotdata2[9]++;
      pointdata2[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.side2 = function(){  
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[3]++;
      }else if(faultcount==1){
        pointdata1[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[4]++;
      }else if(faultcount==1){
        pointdata1[6]++;
      }
    }
    pointdata1[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[7]++;
      }else if(faultcount==1){
        pointdata1[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[8]++;
      }else if(faultcount==1){
        pointdata1[10]++;
      }
    }
    pointdata1[0]++;
  }
  ClickPoint(1,point1);
  if(isStroke==0){
    if(isside==0){
      shotdata2[2]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[3]++;
      pointdata1[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata2[10]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[11]++;
      pointdata1[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.back2 = function(){  
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[3]++;
      }else if(faultcount==1){
        pointdata1[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[4]++;
      }else if(faultcount==1){
        pointdata1[6]++;
      }
    }
    pointdata1[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[7]++;
      }else if(faultcount==1){
        pointdata1[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[8]++;
      }else if(faultcount==1){
        pointdata1[10]++;
      }
    }
    pointdata1[0]++;
  }
  ClickPoint(1,point1);
  if(isStroke==0){
    if(isside==0){
      shotdata2[4]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[5]++;
      pointdata1[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata2[12]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[13]++;
      pointdata1[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.net2 = function(){  
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[3]++;
      }else if(faultcount==1){
        pointdata1[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[4]++;
      }else if(faultcount==1){
        pointdata1[6]++;
      }
    }
    pointdata1[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[7]++;
      }else if(faultcount==1){
        pointdata1[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[8]++;
      }else if(faultcount==1){
        pointdata1[10]++;
      }
    }
    pointdata1[0]++;
  }
  ClickPoint(1,point1);
  if(isStroke==0){
    if(isside==0){
      shotdata2[6]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[7]++;
      pointdata1[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata2[14]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[15]++;
      pointdata1[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.unerror2 = function(){
  ForeBack();
  ConfirmSide();
  point1++;
  displayServer();
  if(Nserverchange==1 || Nserverchange==3){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[3]++;
      }else if(faultcount==1){
        pointdata1[5]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[4]++;
      }else if(faultcount==1){
        pointdata1[6]++;
      }
    }
    pointdata1[0]++;
  }else if(Nserverchange==0 || Nserverchange==2){
    if(foreback==0){
      if(faultcount==0){
        pointdata1[7]++;
      }else if(faultcount==1){
        pointdata1[9]++;
      }
    }else if(foreback==1){
      if(faultcount==0){
        pointdata1[8]++;
      }else if(faultcount==1){
        pointdata1[10]++;
      }
    }
    pointdata1[0]++;
  }
  ClickPoint(1,point1);
  if(isStroke==0){
    if(isside==0){
      shotdata2[16]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[17]++;
      pointdata1[2]++;
    }
  }else if(isStroke==1){
    if(isside==0){
      shotdata2[18]++;
      pointdata1[1]++;
    }else if(isside==1){
      shotdata2[19]++;
      pointdata1[2]++;
    }
  }
  faultcount=0;
  isStroke=0;
  PointUpdate();
  FinishGame();
}
$scope.serverchange2 = function(){
  ServerChangeEasy();
  socket.emit("server-change",{server:server,id:tennisdata.ID});
}

//--------チェンジボタンクリック挙動-----------------------------------------------------
$scope.serverchange = function(){
  ServerChange();
  socket.emit("server-change",{server:server,id:tennisdata.ID});
  faultcount=0;
}
$scope.courtchange = function(){
  faultcount=0;
}
$scope.pointback = function(){
  PointBack();
  faultcount=0;
}
$scope.finishgame = function(){
  ForceQuit();
}
//---------stroke or bolay button motion-----------------------------------------
$scope.strokeClick1 = function(){
  $scope.strokebutton1 = false;
  $scope.bolaybutton1 = true;
  isStroke=1;
}
$scope.bolayClick1 = function(){
  $scope.strokebutton1 = true;
  $scope.bolaybutton1 = false;
  isStroke=0;
}
$scope.strokeClick2 = function(){
  $scope.strokebutton2 = false;
  $scope.bolaybutton2 = true;
  isStroke=1;
}
$scope.bolayClick2 = function(){
  $scope.strokebutton2 = true;
  $scope.bolaybutton2 = false;
  isStroke=0;
}
//---------関数------------------------------------------------------------------
function ScorePoint(check,point){
     if(point == 1){
       if(check==1){$scope.agpoint1="15";
       }else if(check==2){$scope.agpoint2="15";}                  
     }else if(point == 2){
       if(check==1){$scope.agpoint1="30";
       }else if(check==2){$scope.agpoint2="30";}                  
     }else if(point == 3 && point1 < 3 || point == 3 && point2 < 3){
       if(check==1){$scope.agpoint1="40";
       }else if(check==2){$scope.agpoint2="40";}                  
     }else if(point1 == 3 && point2 == 3){
       $scope.agpoint1="DEUCE";
       $scope.agpoint2="DEUCE";
     }else if(point1 == 3 && point2 == 4 || point1 == 4 && point2 == 3){
       if(point1 > point2){
         $scope.agpoint1="Ad";
       }else if(point2 > point1){
         $scope.agpoint2="Ad";
       }
     }else if(point1 == 4 && point2 == 4){
       point1 = 3; point2 = 3;
       $scope.agpoint1="DEUCE"; $scope.agpoint2="DEUCE";
     }else if(point1 == 3 && point2 == 5 || point1 == 5 && point2 == 3){
       if(point1 > point2){
         gamepoint1++;
         GamePoint(1,gamepoint1);
       }else if(point2 > point1){
         gamepoint2++;
         GamePoint(2,gamepoint2);
       }
     }else if(point1 == 4 && point2 < 3){
       gamepoint1++;
       GamePoint(1,gamepoint1);
     }else if(point2 == 4 && point1 < 3){
       gamepoint2++;
       GamePoint(2,gamepoint2);
     }     
}

function GamePoint(check,gamepoint){
  var xx = gamecount-1,
      yy = xx+2;
  ServerChange();
  ServerChangeEasy();
  if(gamepoint < gamecount || gamepoint1 == gamecount && gamepoint2 == (gamecount-1) || gamepoint1 == (gamecount-1) && gamepoint2 == gamecount ){
    ClearPoint();
    if(check==1){$scope.aggame1=gamepoint1
    }else if(check==2){$scope.aggame2=gamepoint2}             
  }else if(gamepoint == gamecount && gamepoint1 < (gamecount-1) || gamepoint == gamecount && gamepoint2 <(gamecount-1) || gamepoint1 == yy && gamepoint2 == xx || gamepoint1 == xx && gamepoint2 == yy){
    if(gamepoint1 > gamepoint2){
      setpoint1++;
      SetPoint(1,setpoint1);
    }else if(gamepoint1 < gamepoint2){
      setpoint2++;
      SetPoint(2,setpoint2);
    }
  }else if(gamepoint1 == gamecount && gamepoint2 == gamecount){
    isTiebreak=true;//タイブレイク　スタート
    ClearPoint();
    $scope.aggame1="TIE BREAK";
    $scope.aggame2="TIE BREAK";
  }
}


function TieBreak(check,point){
  if((point1+point2)%2 == 1){
    ServerChange();
  }
  if(point < 7 || point1 > 5 && point2 > 5 && (point1-point2) == 1 || point1 > 5 && point2 > 5 && (point2-point1)==1 || point1 == point2){
    if(check==1){$scope.agpoint1=point1;
    }else if(check==2){$scope.agpoint2=point2;}
  }else if(point1 > 5 && point2 > 5 && (point1-point2)==2 || point1 > 5 && point2 > 5 && (point2-point1)==2 || point1 == 7 && point2 < 6 || point1 < 6 && point2 == 7){
    $scope.aggame1="0";
    $scope.aggame2="0";
    isTiebreak=false; //タイブレイク終了
    if(point1 > point2){
      gamepoint1++;
      setpoint1++;
      SetPoint(1,setpoint1);
    }else if(point2 > point1){
      gamepoint2++;
      setpoint2++;
      SetPoint(2,setpoint2);
    }
    ClearPoint();
  }
}
function SetPoint(check,setpoint){
  //セットポイントのカウント
  //ゲームカウントの保存
  numgamecount++;
  if(numgamecount==1){gamecountsave[0]=gamepoint1;gamecountsave[1]=gamepoint2;
  }else if(numgamecount==2){gamecountsave[2]=gamepoint1;gamecountsave[3]=gamepoint2;
  }else if(numgamecount==3){gamecountsave[4]=gamepoint1;gamecountsave[5]=gamepoint2;
  }else if(numgamecount==4){gamecountsave[6]=gamepoint1;gamecountsave[7]=gamepoint2;
  }else if(numgamecount==5){gamecountsave[8]=gamepoint1;gamecountsave[9]=gamepoint2;}
  ClearPoint();
  gamepoint1=0;
  gamepoint2=0;
  $scope.aggame1="0";
  $scope.aggame2="0";
  console.log(gamecountsave);
  if(check==1){$scope.agset1=setpoint1;
  }else if(check==2){$scope.agset2=setpoint2;}
  if(setcount == 1){
      if(setpoint1 == 1){
        if(gametype=="1"){winner=player1;
        }else{winner=player1+" & "+player3;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }else if(setpoint2 == 1){
        if(gametype=="1"){winner=player2;
        }else{winner=player2+" & "+player4;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }                                              
  }else if(setcount == 3){
      if(setpoint1 == 2){
        if(gametype=="1"){winner=player1;
        }else{winner=player1+" & "+player3;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }else if(setpoint2 == 2){
        if(gametype=="1"){winner=player2;
        }else{winner=player2+" & "+player4;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }
  }else if(setcount == 5){
      if(setpoint1 == 3){
        if(gametype=="1"){winner=player1;
        }else{winner=player1+" & "+player3;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }else if(setpoint2 == 3){
        if(gametype=="1"){winner=player2;
        }else{winner=player2+" & "+player4;}
        console.log(winner + "が勝者です");
        isGameSet = true;
      }
    }
}
function FinishGame(){
  if(tennisdata.player1=="112233aabbddcceeii989jyjisegoku"){console.log("へんことしてんじゃねーよ！！");
  }else{
    if(isGameSet == true){
          var gamecounttext=new Array();
          if(numgamecount==1){gamecounttext[0]=gamecountsave[0]+"-"+gamecountsave[1]+":"}
          else if(numgamecount==2){gamecounttext[0]=gamecountsave[0]+"-"+gamecountsave[1]+":"+gamecountsave[2]+"-"+gamecountsave[3]+":"}
          else if(numgamecount==3){gamecounttext[0]=gamecountsave[0]+"-"+gamecountsave[1]+":"+gamecountsave[2]+"-"+gamecountsave[3]+":"+gamecountsave[4]+"-"+gamecountsave[5]+":"}
          else if(numgamecount==4){gamecounttext[0]=gamecountsave[0]+"-"+gamecountsave[1]+":"+gamecountsave[2]+"-"+gamecountsave[3]+":"+gamecountsave[4]+"-"+gamecountsave[5]+":"+gamecountsave[6]+"-"+gamecountsave[7]+":"}
          else if(numgamecount==5){gamecounttext[0]=gamecountsave[0]+"-"+gamecountsave[1]+":"+gamecountsave[2]+"-"+gamecountsave[3]+":"+gamecountsave[4]+"-"+gamecountsave[5]+":"+gamecountsave[6]+"-"+gamecountsave[7]+":"+gamecountsave[8]+"-"+gamecountsave[9]+":"}
          var time=Date.now(); 
          var alertPopup = $ionicPopup.alert({
            title:"ゲーム終了です。トップページに戻ります。試合結果の詳細は''試合データ''をみてください。"
          });
          location.href = "#/tab/dash";
          socket.emit('delete-data',{id:tennisdata.ID,winner:winner,finishtime:time,gamecounttext:gamecounttext});
        }
      }
}
function ForceQuit(){
          var confirmPopup = $ionicPopup.confirm({
            title:'試合終了',
            template:"試合終了でよろしいですか。",
            cancelText:"Cancel",
            cancelType:"button-calm",
            okText:"OK",
            okType:"button-energized"
        });
        confirmPopup.then(function(res){
            if(res){
              isGameSet = true;
              FinishGame();
            }
          });
    }
function ClearPoint(){
  point1=0;
  point2=0;
  $scope.agpoint1="0";
  $scope.agpoint2="0";
}
function ClickPoint(check,point){
  console.log("foreback = "+foreback);
  if(!isTiebreak){
    ScorePoint(check,point);
  }else if(isTiebreak){
    TieBreak(check,point);
  }
}
function ForeBack(){
    if((point1+point2)%2 == 0){
      foreback = 0;
    }else{
      foreback = 1;
    }
    console.log("foreback = "+foreback+"&& isside = "+isside+"&& faultcount ="+faultcount+"Nserverchange = "+Nserverchange);
}
  function ServerChange(){
    Nserverchange++;
    if(gametype == "1"){
      switch (Nserverchange){
        case 1:
          displayType(2);
          server[0]="";
          server[1]="●";
            break;
        case 2:  
          displayType(1);
          server[0]="●";
          server[1]="";
          Nserverchange=0;
          break;
      }
    }else{
      switch (Nserverchange){
        case 1:
          $scope.agserver2 = player2;
          displayType(2);
          server[0]="";
          server[1]="●";
          break;
        case 2:
          $scope.agserver1 = player3;
          displayType(1);
          server[0]="●";
          server[1]="";
          break;
        case 3:
          $scope.agserver2 = player4;
          displayType(2);
          server[0]="";
          server[1]="●";
          break;
        case 4:
          $scope.agserver1 = player1;
          displayType(1);
          Nserverchange=0;
          server[0]="●";
          server[1]="";
          break;
      }
    }
  }
  function displayServer(){
    if(gametype == "1"){
      if(Nserverchange == 1){
        $scope.agserver2 == player2;
        displayType(2);
      }else{
        $scope.agserver1 == player1;
        displayType(1);
      }
    }else if(gametype == "2"){
      switch (Nserverchange){
        case 0:
          $scope.agserver1 = player1;
          displayType(1);
          break;
        case 1:
          $scope.agserver2 = player2;
          displayType(2);
          break;
        case 2:
          $scope.agserver1 = player3;
          displayType(1);
          break;
        case 3:
          $scope.agserver2 = player4;
          displayType(2);
          break;
        case 4:
          $scope.agserver1 = player1;
          displayType(1);
          break;
      }
    }
  }
  function displayReceiver(){
    if((point1+point2)%2==0){
      foreback=0;
    }else{
      foreback=1;
    }
    if(gametype == "1"){
      if(Nserverchange == 1){
        $scope.agreceiver1 = player1;
        displayType(3);
      }else{
        $scope.agreceiver2 = player2;
        displayType(4);
      }
    }else{
      if(Nserverchange == 1 || Nserverchange == 3){
        if(foreback == 0){
          $scope.agreceiver1 = player1;
        }else{
          $scope.agreceiver1 = player3;
        }
        displayType(3);
      }else{
        if(foreback == 0){
          $scope.agreceiver2 = player2;
        }else{
          $scope.agreceiver2 = player4;
        }
        displayType(4);
      }
    }
  }
  function displayType(type){
    switch (type){
      case 1:
        $scope.serverbutton1=true;
        $scope.serverbutton2=false;
        $scope.checkserver1=true;
        $scope.checkserver2=false;
        $scope.checkreceiver1=false;
        $scope.checkreceiver2=false;
        $scope.returnbutton1=false;
        $scope.returnbutton2=false;
        $scope.shotbutton1=false;
        $scope.shotbutton2=false;
        $scope.faultbutton1=true;
        $scope.faultbutton2=false;
        $scope.doublefaultbutton1=false;
        $scope.doublefaultbutton2=false;
        break;
      case 2:
        $scope.serverbutton1=false;
        $scope.serverbutton2=true;
        $scope.checkserver1=false;
        $scope.checkserver2=true;
        $scope.checkreceiver1=false;
        $scope.checkreceiver2=false;
        $scope.returnbutton1=false;
        $scope.returnbutton2=false;
        $scope.shotbutton1=false;
        $scope.shotbutton2=false;
        $scope.faultbutton1=false;
        $scope.faultbutton2=true;
        $scope.doublefaultbutton1=false;
        $scope.doublefaultbutton2=false;
        break;
      case 3:
        $scope.serverbutton1=false;
        $scope.serverbutton2=false;
        $scope.checkserver1=false;
        $scope.checkserver2=false;
        $scope.checkreceiver1=true;
        $scope.checkreceiver2=false;
        $scope.returnbutton1=true;
        $scope.returnbutton2=false;
        $scope.shotbutton1=false;
        $scope.shotbutton2=false;
        $scope.faultbutton1=false;
        $scope.faultbutton2=false;
        $scope.doublefaultbutton1=false;
        $scope.doublefaultbutton2=false;
        break;
      case 4:
        $scope.serverbutton1=false;
        $scope.serverbutton2=false;
        $scope.checkserver1=false;
        $scope.checkserver2=false;
        $scope.checkreceiver1=false;
        $scope.checkreceiver2=true;
        $scope.returnbutton1=false;
        $scope.returnbutton2=true;
        $scope.shotbutton1=false;
        $scope.shotbutton2=false;
        $scope.faultbutton1=false;
        $scope.faultbutton2=false;
        $scope.doublefaultbutton1=false;
        $scope.doublefaultbutton2=false;
        break;
      case 5:
        $scope.serverbutton1=false;
        $scope.serverbutton2=false;
        $scope.checkserver1=false;
        $scope.checkserver2=false;
        $scope.checkreceiver1=false;
        $scope.checkreceiver2=false;
        $scope.returnbutton1=false;
        $scope.returnbutton2=false;
        $scope.shotbutton1=true;
        $scope.shotbutton2=true;
        $scope.faultbutton1=false;
        $scope.faultbutton2=false;
        $scope.doublefaultbutton1=false;
        $scope.doublefaultbutton2=false;
        break;
    }
    $scope.strokebutton1 = true;
    $scope.bolaybutton1 = false;
    $scope.strokebutton2 = true;
    $scope.bolaybutton2 = false;
  }
function ConfirmSide(){
    var confirmPopup = $ionicPopup.confirm({
      title:'Fore or Back',
      template:"フォアハンドかバックハンドを押してください。",
      cancelText:"Back Hand",
      cancelType:"button-calm",
      okText:"Fore Hand",
      okType:"button-energized"
    });
    confirmPopup.then(function(res){
      if(res){
        console.log("fore!!");
        isside = 0;
      }else{
        console.log("back!!!");
        isside = 1;
      }
    })
  }
  function PointUpdate(){
    if(tennisdata.player1=="112233aabbddcceeii989jyjisegoku"){console.log("へんなデータつくってんじゃねーよ！！！！");
     }else{
        numaction++;
        pointtext[0]=$scope.agpoint2;
        pointtext[1]=$scope.agpoint1;
        pointtext[2]=$scope.aggame2;
        pointtext[3]=$scope.aggame1;
        pointtext[4]=$scope.agset2;
        pointtext[5]=$scope.agset1;
        pointtext2[0]=setpoint1;
        pointtext2[1]=setpoint2;
        pointtext2[2]=gamepoint1;
        pointtext2[3]=gamepoint2;
        pointtext2[4]=point1;
        pointtext2[5]=point2;
    /*if(Nserverchange==0 || Nserverchange==2){
      server[0]="●";
      server[1]="";
    }else if(Nserverchange==1 || Nserverchange==3){
      server[0]="";
      server[1]="●";
    }*/
  console.log(ActionTennis);
  socket.emit('point-update',{dataid:tennisdata.ID,pointdata1:pointdata1,server1:serverside1,return1:returnside1,shot1:shotdata1,pointdata2:pointdata2,server2:serverside2,return2:returnside2,shot2:shotdata2,pointtext:pointtext,pointtext2:pointtext2,server:server,numaction:numaction});
}
}
  function PointBack(){
    if(numaction===0 || numaction == null){}
    else{
      socket.emit('point-back',{num:numaction,id:tennisdata.ID});
      $scope.agpoint2=ActionTennis[numaction-1].PointText.text[0];
      $scope.agpoint1=ActionTennis[numaction-1].PointText.text[1];
      $scope.aggame2=ActionTennis[numaction-1].PointText.text[2];
      $scope.aggame1=ActionTennis[numaction-1].PointText.text[3];
   $scope.agset2=ActionTennis[numaction-1].PointText.text[4];
      $scope.agset1=ActionTennis[numaction-1].PointText.text[5];
      setpoint1=ActionTennis[numaction-1].PointText.point[0];
      setpoint2=ActionTennis[numaction-1].PointText.point[1];
      gamepoint1=ActionTennis[numaction-1].PointText.point[2];
      gamepoint2=ActionTennis[numaction-1].PointText.point[3];
      point1=ActionTennis[numaction-1].PointText.point[4];
      point2=ActionTennis[numaction-1].PointText.point[5];
      
      /* 
      for(var i=0;i<pointdata1.length;i++)pointdata1[i]=ActionTennis[numaction-1].PointData1.point;
      for(var i=0;i<serverside1.length;i++)serverside1[i]=ActionTennis[numaction-1].ServerSide1.point;
      for(var i=0;i<returnside1.length;i++)returnside1[i]=ActionTennis[numaction-1].ReturnSide1.point;
      for(var i=0;i<shotdata1.length;i++)shotdata1[i]=ActionTennis[numaction-1].ShotPoint1.point;
      for(var i=0;i<pointdata2.length;i++)pointdata2[i]=ActionTennis[numaction-1].PointData2.point;
      for(var i=0;i<serverside2.length;i++)serverside2[i]=ActionTennis[numaction-1].ServerSide2.point;
      for(var i=0;i<returnside2.length;i++)returnside2[i]=ActionTennis[numaction-1].ReturnSide2.point;
      for(var i=0;i<shotdata2.length;i++)shotdata2[i]=ActionTennis[numaction-1].ShotPoint2.point;*/
      if(ActionTennis[numaction-1].PointText.server[0]==""){
        Nserverchange=0;
        serverchange2=0;
      }else{
        Nserverchange=1;
        serverchange2=1
      }
      ServerChange();
      ServerChangeEasy();
      numaction=numaction-1;
      ActionTennis.splice(numaction+1,1);
    }
  }
  socket.on('add-tennisdata',function(data){
    ActionTennis.push(data);
  })
  /* socket.on('point-back',function(data){
      numaction=data.numaction;
      for(var i=0;i<pointdata1.length;i++)pointdata1[i]=data.PointData1.point;
      for(var i=0;i<serverside1.length;i++)serverside1[i]=data.ServerSide1.point;
      for(var i=0;i<returnside1.length;i++)returnside1[i]=data.ReturnSide1.point;
      for(var i=0;i<shotdata1.length;i++)shotdata1[i]=data.ShotPoint1.point;
      for(var i=0;i<pointdata2.length;i++)pointdata2[i]=data.PointData2.point;
      for(var i=0;i<serverside2.length;i++)serverside2[i]=data.ServerSide2.point;
      for(var i=0;i<returnside2.length;i++)returnside2[i]=data.ReturnSide2.point;
      for(var i=0;i<shotdata2.length;i++)shotdata2[i]=data.ShotPoint2.point;
      if(data.PointText.server[0]==""){
        Nserverchange=0;
        serverchange2=0;
      }else{
        Nserverchange=1;
        serverchange2=1
      }
      ServerChange();
      ServerChangeEasy();
  }); */
  //Easy Mode----------------------------------------------------------
  $scope.point1 = function(){
    point1++;
    ClickPoint(1,point1);
    PointUpdate();
    FinishGame();
  }
  $scope.point2 = function(){
    point2++;
    ClickPoint(2,point2);
    PointUpdate();
    FinishGame();
  }
  function ServerChangeEasy(){
      serverchange2++;
      if(serverchange2 == 1){
        $scope.checkserver22 = true;
        $scope.checkreceiver11 = true;
        $scope.checkserver11 = false;
        $scope.checkreceiver22 = false;
          server[0]="";
          server[1]="●";
      }else if(serverchange2 == 2){
        $scope.checkserver11 = true;
        $scope.checkreceiver22 = true;
        $scope.checkserver22 = false;
        $scope.checkreceiver11 = false;
          server[0]="●";
          server[1]="";
        serverchange2=0;
      }
  }
})

//---view game in real time controller-----------------------------------------------------
.controller('ViewgameCtrl',function($scope,socket,TennisID,$ionicFrostedDelegate,$ionicScrollDelegate,$document,$ionicPopup){
    $document.ready(function(){
        socket.emit('connected');
    });

    var tennisdatas = new Array();
    $scope.tennisdatas = tennisdatas;
    socket.on('create-tennis',function(tennisdata){
      tennisdatas.splice(0,tennisdatas.length);
        tennisdata.forEach(function(data){
            tennisdatas.push(data);
            $ionicFrostedDelegate.update();
            $ionicScrollDelegate.scrollBottom(true);
        });
    });
    socket.on('tennis-viewer',function(data){
        tennisdatas.push(data);
        $ionicFrostedDelegate.update();
        $ionicScrollDelegate.scrollBottom(true);
    });
    socket.on('point-update',function(data){
      $scope.tennisdatas.forEach(function(tennis){
          if(tennis._id == data._id){
            tennis.PointText.text = data.PointText.text;
            tennis.PointText.server = data.PointText.server;
          }
      });
  });
  socket.on('server-change',function(data){
      console.log(data.server);
      $scope.tennisdatas.forEach(function(tennis){
          if(tennis._id == data.id){
            tennis.PointText.server = data.server;
          }
      })
  });
  socket.on('delete-data',function(data){
          tennisdatas.some(function(v,i){
            if(v._id==data._id){
              tennisdatas.splice(i,1);
            }
          });
    console.log('deleteしたぞ');
  });
  socket.on('masaki-delete',function(data){
      tennisdatas.some(function(v,i){
          if(v._id==data.id){
              tennisdatas.splice(i,1);
          }
      });
  });
  $scope.dblclickremovedata = function(myid){
    $scope.data = {}
    var myPopup = $ionicPopup.show({
        template:'<input type="password" ng-model="data.password">',
        title:'Dataを削除するパスワード',
        subTitle:'パスワードを入力してください。',
        scope:$scope,
        buttons:[
          {text:'Cancel'},
          {
            text:'Delete',
            type:'button-assertive',
            onTap:function(e){
              if($scope.data.password == "masakidelete"){
                socket.emit('masaki-delete',{id:myid});
                console.log("削除するぜ!");
              }else{
                e.preventDefault();
              }
            }
          }
        ]
    });
  }
})


//----------------
//--ChatsCtrl------
//----------------
.controller('ChatsCtrl', function($scope,socket,$ionicFrostedDelegate,$ionicScrollDelegate,TennisID,$document,$ionicPopup) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  //
  var chatname;
  $document.ready(function(){
    $scope.data = {}
    var myPopup = $ionicPopup.show({
        template:'<input type="text" ng-model="data.chatname">',
        title:'Chat Name',
        subTitle:'Chatで使う名前を入力してください。',
        scope:$scope,
        buttons:[
          {
            text:'決定',
            type:'button-assertive',
            onTap:function(e){
              if($scope.data.chatname==null || $scope.data.chatname==""){
                window.alert("名前を入力してください。"); 
                e.preventDefault();
              }else{
                chatname = $scope.data.chatname;
                var timeData = new Date();
                var month = timeData.getMonth()+1;
                var date = timeData.getFullYear()+"/"+month+"/"+timeData.getDate();
                var time = Date.now();
                var data = {
                        date:date,
                        name:"ログイン情報",
                        message:chatname+"がログインしました。",
                        time:time,
                };
                socket.emit('send-chat',data);
              }
            }
          }
        ]
    });
        socket.emit('connected');
    });
  //-----チャット送信--------------------------------
  var messages = new Array();
  var timeData = new Date();
  var month = timeData.getMonth()+1;
  var date = timeData.getFullYear()+"/"+month+"/"+timeData.getDate();
  $scope.messages = messages;
  $scope.submitclick = function(){
    var message = $scope.message;
    if(message == "" || message == null){
      window.alert("Messageを入力してください");
    }else{
      var timeData = new Date();
      var month = timeData.getMonth()+1;
      var date = timeData.getFullYear()+"/"+month+"/"+timeData.getDate();
      var time = Date.now();
      var data = {
        date:date,
        name:chatname,
        message:message,
        time:time,
      };
      $scope.message = "";
      socket.emit('send-chat',data);
    }
    $ionicFrostedDelegate.update()
    $ionicScrollDelegate.scrollBottom(true);
  }
  socket.on('create-chat',function(chatdata){
      messages.splice(0,messages.length);
      chatdata.forEach(function(data){
          if(data.date == date){
            messages.push(data);
          }
      });
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
  });
  socket.on('send-chat',function(data){
      messages.push(data);
      console.log(data);
      $ionicFrostedDelegate.update();
      $ionicScrollDelegate.scrollBottom(true);
  });
})

/*.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})
*/
//---my controller--------------
.controller('DatalistCtrl',function($scope,$document,socket,TennisDataDetail,$ionicPopup){
    $scope.data={
      showDelete:false
    }
    $scope.deletetennisdata=function(myid){
    $scope.data = {}
    var myPopup = $ionicPopup.show({
        template:'<input type="password" ng-model="data.password">',
        title:'Dataを削除するパスワード',
        subTitle:'パスワードを入力してください。',
        scope:$scope,
        buttons:[
          {text:'Cancel'},
          {
            text:'Delete',
            type:'button-assertive',
            onTap:function(e){
              if($scope.data.password == "masakidelete"){
                socket.emit('masaki-tennis-delete',{id:myid});
                console.log("削除するぜ!");
              }else{
                e.preventDefault();
              }
            }
          }
        ]
    });
      console.log(myid);
    }
  socket.on('masaki-tennis-delete',function(data){
      tennisdatas.some(function(v,i){
          if(v._id==data.id){
              tennisdatas.splice(i,1);
          }
      });
  });
    $document.ready(function(){
        socket.emit('connected');
    });
    
    var tennisdatas = new Array();
    $scope.tennisdatas = tennisdatas;
    socket.on('create-gamedata',function(gamedata){
      tennisdatas.splice(0,tennisdatas.length);
        gamedata.forEach(function(data){
            tennisdatas.unshift(data);
        });
        TennisDataDetail.add(tennisdatas);
        console.log(TennisDataDetail.all());
    });
    socket.on('add-gamedata',function(gamedata){
        tennisdatas.unshift(gamedata);
        TennisDataDetail.add(tennisdatas);
    });
})
.controller('DataDetailCtrl',function($scope,TennisDataDetail,$stateParams){
    $scope.tennisdata = TennisDataDetail.get($stateParams.tennisdataId);
    console.log(TennisDataDetail.get($stateParams.tennisdataId));
})
.controller('AccountCtrl', function($scope) {

})
.controller('EasyScoreBoardCtrl',function($scope,$controller){
    $controller('scoreboardCtrl',{$scope:$scope});
})
.controller('not',function($scope){
});
