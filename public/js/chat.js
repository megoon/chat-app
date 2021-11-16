const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

     // Height of messages container
     const newMessageStyles = getComputedStyle($newMessage)
     const newMessageMargin = parseInt(newMessageStyles.marginBottom)
     const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

     // Visible height
     const visibleHeight = $messages.offsetHeight

     // Height of message container
     const containerHeight = $messages.scrollHeight

     // How far have I scrolled?
     const scrollOffset = $messages.scrollTop + visibleHeight

     if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
     }

}
socket.on('message', (message, callback) => {
    console.log(message);
    console.log(username, room);
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createAt : moment(message.createAt).format('h:mm a')
    })
    
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

document.querySelector('#message-form').addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value 
    socket.emit('sendMessage', message, ()=>{
        console.log('Message Delivered');
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
    })
})

socket.on('locationMessage', (message)=>{
    console.log(message);
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url : message.url,
        createAt : moment(message.createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by browser')
    }
    $locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude:position.coords.longitude
        }, () => {
            console.log('Location Shared!');
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error)=> {
    if (error) {
        alert(error)
        location.href = '/'
    }
})