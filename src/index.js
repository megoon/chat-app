const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const publicDirectoryPath = path.join(__dirname, '../public')
const server = http.createServer(app)
const io = socketio(server)


app.use(express.static(publicDirectoryPath))

const port = process.env.PORT ||3000
app.get('/', (req, res)=>{
    res.render(index.html)
})


io.on('connection', (socket)=>{
    console.log('New webSocket Connection')

    

    socket.on('join',(options, callback) => {

        const { error, user } = addUser({id : socket.id, ...options})

        if (error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)

        if (user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomDate', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })


})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})