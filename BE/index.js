const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    },
    pingInterval: 100000,
    pingTimeout: 5000
  });

var participantList = new Set();

app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/index.html");
});

//참가자 본인 입장(소켓 연결)
io.on("connection",(socket)=>{
    console.log('a user connect');

    socket.on("", (data,callback) => {
        console.log(data);
        console.log(data["code"]);
        user = data["data"];
        console.log(participantList);

        switch(data["code"]){
            case 1001:  //연결
                console.log("connect "+ user["nickname"]);
                //본인 입장
                var result = initUser(user["nickname"]);
                
                //다른 참가자 추가
                var response = {
                    code : 3000,
                    data : result
                }
                socket.broadcast.emit('', response);

                //본인 입장 결과 반환
                callback({
                    code : 1001,
                    data : result
                });
                break;
            case 1002:  //연결 해제
                console.log("disconnect " + user["userId"]);
                //참가자 삭제 
                deleteUser(user);

                //다른 참가자 삭제
                var response = {
                    code : 3001,
                    data : user["userId"]
                }
                socket.broadcast.emit('', response);
                
                break;
            case 2001:  //참가자 본인 위치 전송
                console.log("participation " + user["userId"]);
                updateUser(user);
                break;    
        }

        console.log(participantList);
    })

    // setTimeout(() => {
    //     //다른 참가자 위치 싱크
    //     var response = {
    //         code : 2002,
    //         data : JSON.stringify(Array.from(participantList))            
    //     }
    //     io.emit('', response);
    // }, 3000);

    socket.on('disconnect', () => {
                console.log(socket.id);
                console.log('클라이언트가 연결을 종료했습니다.');
    });
});
const initUser = (nickname) =>{
    user = {
        userId : participantList.size,  //동시성 이슈 해결 필요
        nickname : nickname,
        positionX : Math.random(),
        positionY : Math.random(),
        direction : 2
    }
    addUser(user);
    return user;
}

const addUser = (user) => {
    participantList.add(user);
}

const updateUser = (user) => {
    const isDeleted = deleteUser(user);
    if(isDeleted){
        addUser(user);
    }
}

const deleteUser = (user) => {
    var userId = user["userId"];

    participantList.forEach((user) => {
        if (user.userId === userId) {
            return participantList.delete(user);
        }
    });
    console.log(userId);
}

const deleteUserBySocketId = (socketId) => {
    participantList.forEach((user) => {
        if (user.socketId === socketId) {
            return participantList.delete(user);
        }
    });
    console.log(userId);
}
  

server.listen(3001,()=>{
    console.log('listening on *:3001');
})

const setUpdates = () => {
    var response = {
        code : 2002,
        data : JSON.stringify(Array.from(participantList))            
    }
    io.emit('', response);
}

setInterval(setUpdates, 3000);