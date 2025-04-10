// import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import './styles.css';
// import axios from 'axios';
// import { Paperclip } from "lucide-react";

// const socket = io('http://localhost:5000');

// function Chat() {
//   const [message, setMessage] = useState('');
//   const [username, setUsername] = useState('');
//   const [onlineUsers, setOnlineuser] = useState([]);
//   const [listner, setListner] = useState('');
//   const [allchat, setAllchat] = useState([]);
//   const [userMap, setUserMap] = useState({});
//   const [file, setFile] = useState(null);
//   const [showModal, setShowModal] = useState(true);

//   useEffect(() => {
//     const handleOnlineUsers = (onlineUserslist) => setOnlineuser(onlineUserslist);
//     socket.on('onlineUsers', handleOnlineUsers);

//     const handleOnlineUserstwo = (users) => setUserMap(users);
//     socket.on('onlineUserswithnames', handleOnlineUserstwo);

//     const handleAllchat = (allchat) => setAllchat(allchat);
//     socket.on('receive_message', handleAllchat);

//     const handleAllchattwo = (allchat, socketid) => {
//       if (listner === socketid) setAllchat(allchat);
//     };
//     socket.on('receive_message_sec', handleAllchattwo);

//     return () => {
//       socket.off('onlineUsers', handleOnlineUsers);
//       socket.off('onlineUserswithnames', handleOnlineUserstwo);
//       socket.off('receive_message', handleAllchat);
//       socket.off('receive_message_sec', handleAllchattwo);
//     };
//   }, [listner]);

//   const sendtext = () => {
//     if (!message.trim()) return alert('Message cannot be empty!');
//     if (!listner) return alert('Please select a user to chat with.');
    
//     socket.emit('sendMessage', { listner, message });
//     setMessage('');
//   };

//   const startChat = (username) => {
//     const userKey = userMap[username];
//     setListner(userKey);
//     socket.emit('getchathistory', userKey);
//   };

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const sendFile = async () => {
//     if (!listner) return alert('Please select a user to chat with.');
//     if (file) {
//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         const res = await axios.post('http://localhost:5000/upload', formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });

//         const filePath = res.data.filePath;
//         socket.emit('sendMessage', { listner, message: filePath });
//         setFile(null);
//       } catch (err) {
//         console.error(err);
//       }
//     }
//   };

//   const handleUsernameSubmit = () => {
//     if (!username.trim()) return alert('Please enter a valid username.');
//     socket.emit('register', username);
//     setShowModal(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
//       {/* Username Input Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-96">
//             <h2 className="text-lg font-bold mb-4">Enter Your Username</h2>
//             <input
//               type="text"
//               placeholder="Enter your username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
//             />
//             <button
//               onClick={handleUsernameSubmit}
//               className="mt-4 w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-150"
//             >
//               Save
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
//           Real-Time Chat
//         </h1>

//         <div className="flex gap-6">
//           {/* Online Users Sidebar */}
//           <div className="w-1/4 bg-white rounded-lg shadow-lg h-[80vh]">
//             <div className="p-4 border-b border-gray-200">
//               <h2 className="text-lg font-semibold text-gray-700">Online Users</h2>
//             </div>
//             <div className="overflow-y-auto h-[calc(100%-60px)]">
//               {Object.entries(userMap)
//                 .filter(([username, id]) => id !== socket.id)
//                 .map(([username, id]) => (
//                   <div
//                     key={id}
//                     onClick={() => startChat(username)}
//                     className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 ${
//                       listner === id ? 'bg-blue-50' : ''
//                     }`}
//                   >
//                     <div className="flex items-center">
//                       <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
//                         {username.slice(0, 2).toUpperCase()}
//                       </div>
//                       <span className="ml-3 text-sm text-gray-700 truncate">{username}</span>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>

//           {/* Chat Area */}
//           <div className="flex-1 bg-white rounded-lg shadow-lg h-[80vh] flex flex-col">
//             <div className="p-4 border-b border-gray-200">
//               <h2 className="text-lg font-semibold text-gray-700">
//                 {listner ? `Chat with: ${Object.keys(userMap).find((username) => userMap[username] === listner)}` : 'Select a user to start chatting'}
//               </h2>
//             </div>

//             {/* Messages */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {allchat.map(({ sender, message, senderUsername }, idx) => (
//                 <div key={`${sender}-${idx}`} className={`flex ${sender === socket.id ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`max-w-[70%] rounded-lg px-4 py-2 ${sender === socket.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
//                     {message.startsWith('http://localhost:5000/') ? (
//                       <a href={message} target="_blank" rel="noopener noreferrer">{message}</a>
//                     ) : (
//                       <p className="text-sm">{message}</p>
//                     )}
//                     <p className="text-xs mt-1 opacity-75">{sender === socket.id ? 'You' : senderUsername}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Message Input */}
//             <div className="p-4 border-t border-gray-200">
//               <div className="flex space-x-4">
//                 <input
//                   type="text"
//                   value={message}
//                   onChange={(e) => setMessage(e.target.value)}
//                   placeholder="Type your message..."
//                   className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
//                 />
//                 <button onClick={sendtext} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-150">
//                   Send
//                 </button>
//                 <input type="file" id="fileInput" onChange={handleFileChange} className="hidden" />
//                 <label htmlFor="fileInput" className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
//                   <Paperclip className={`w-6 h-6 ${file ? "text-green-500" : "text-gray-500"}`} />
//                 </label>
//                 <button onClick={sendFile} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-150">
//                   Send File
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Chat;

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './chat.css';
import axios from 'axios';
import { Paperclip } from "lucide-react";

const socket = io('http://localhost:3001');

function Chat(){
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [onlineUsers, setOnlineuser] = useState([]);
  const [listner, setListner] = useState('');
  const [allchat, setAllchat] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const handleOnlineUsers = (onlineUserslist) => setOnlineuser(onlineUserslist);
    socket.on('onlineUsers', handleOnlineUsers);

    const handleOnlineUserstwo = (users) => setUserMap(users);
    socket.on('onlineUserswithnames', handleOnlineUserstwo);

    const handleAllchat = (allchat) => setAllchat(allchat);
    socket.on('receive_message', handleAllchat);

    const handleAllchattwo = (allchat, socketid) => {
      if (listner === socketid) setAllchat(allchat);
    };
    socket.on('receive_message_sec', handleAllchattwo);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('onlineUserswithnames', handleOnlineUserstwo);
      socket.off('receive_message', handleAllchat);
      socket.off('receive_message_sec', handleAllchattwo);
    };
  }, [listner]);

  const sendtext = () => {
    if (!message.trim()) return alert('Message cannot be empty!');
    if (!listner) return alert('Please select a user to chat with.');
    socket.emit('sendMessage', { listner, message });
    setMessage('');
  };

  const startChat = (username) => {
    const userKey = userMap[username];
    setListner(userKey);
    socket.emit('getchathistory', userKey);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendFile = async () => {
    if (!listner) return alert('Please select a user to chat with.');
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('http://localhost:3001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const filePath = res.data.filePath;
        socket.emit('sendMessage', { listner, message: filePath });
        setFile(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) return alert('Please enter a valid username.');
    socket.emit('register', username);
    setShowModal(false);
  };

  return (
    <div className="main-container">
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Enter Your Username</h2>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleUsernameSubmit}>Save</button>
          </div>
        </div>
      )}

      <div className="chat-wrapper">
        <h1 className="title">Real-Time Chat</h1>
        <div className="chat-container">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>Online Users</h2>
            </div>
            <div className="user-list">
              {Object.entries(userMap)
                .filter(([username, id]) => id !== socket.id)
                .map(([username, id]) => (
                  <div
                    key={id}
                    onClick={() => startChat(username)}
                    className={`user-item ${listner === id ? 'active' : ''}`}
                  >
                    <div className="user-avatar">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="user-name">{username}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-header">
              <h2>
                {listner
                  ? `Chat with: ${Object.keys(userMap).find((username) => userMap[username] === listner)}`
                  : 'Select a user to start chatting'}
              </h2>
            </div>

            <div className="chat-messages">
              {allchat.map(({ sender, message, senderUsername }, idx) => (
                <div key={`${sender}-${idx}`} className={`chat-message ${sender === socket.id ? 'right' : 'left'}`}>
                  <div className={`message-box ${sender === socket.id ? 'sent' : 'received'}`}>
                    {message.startsWith('http://localhost:3001/') ? (
                      <a href={message} target="_blank" rel="noopener noreferrer">{message}</a>
                    ) : (
                      <p>{message}</p>
                    )}
                    <span className="sender">{sender === socket.id ? 'You' : senderUsername}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <button onClick={sendtext}>Send</button>
              <input type="file" id="fileInput" onChange={handleFileChange} className="file-input" />
              <label htmlFor="fileInput" className="icon-btn">
                <Paperclip className={`icon ${file ? 'highlighted' : ''}`} />
              </label>
              <button onClick={sendFile} className="file-send-btn">Send File</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
