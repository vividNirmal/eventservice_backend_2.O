import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
// import messageSchema from '../domain/schema/message.schema';
// import chatSchema from '../domain/schema/chat.schema';
// import { loggerMsg } from '../lib/logger';
// import { fileSchema } from '../domain/schema/file.schema';
// import userSchema from '../domain/schema/user.schema';
// import { callAccepted, callEnded, initiateCall, rejectCall } from '../domain/models/callhistory.model';
// import { User } from '../domain/schema/user.schema';


interface UserSocketMap {
  [userId: string]: string;
}

interface UserIsInCall {
  [userId: string]: boolean
}
export const userSocketMap: UserSocketMap = {};
export const userSocketInCall: UserIsInCall = {}

export const initDemoSocketHandlers = (io:Server) => {
  io.on("connection", (socket) => {
    console.log(`New User Connected: ${socket.id}`)
    
    // Join chat room
    socket.on('joinChat', (data) => {
      const {userId} = data
      socket.join(userId);
      userSocketMap[userId] = socket.id;
      socket.broadcast.emit('user-online',{userId});
      console.log(`User ${userId} logged in with socket ID ${socket.id}`);
    });

/*
    // Initiate a Call
    socket.on("initiate-call", async ({ callerId, recipientId, channelName, callType }, callback) => {
      const recipientSocketId = userSocketMap[recipientId];

      // Check if callback is a function
      if (typeof callback !== "function") {
          console.log("Callback not provided or not a function, fallback for testing.");
          callback = (response: any) => console.log(response); // Fallback callback function
      }
      if (userSocketInCall[recipientId]) {
          return callback({ success: false, message: "Recipient is busy." });
      }
  
      try {
          // Save the call history as 'initiate-call'
          const callHistory = await initiateCall(callerId, recipientId, channelName, callType);
          const callHistoryId = callHistory._id;
  
          if (recipientSocketId) {
              // Notify recipient about the incoming call
              socket.to(recipientSocketId).emit('incoming-call', { callerId, channelName, callHistoryId });
  
              // Timeout handling
              const timeout = setTimeout(() => {
                  // Notify both users that the call timed out
                  if (userSocketInCall[callerId]) {
                      const callerSocketId = userSocketMap[callerId];
                      if (callerSocketId) {
                          socket.to(callerSocketId).emit("call-timeout", { recipientId });
                      }
                  }
  
                  if (userSocketInCall[recipientId]) {
                      const recipientSocketId = userSocketMap[recipientId];
                      if (recipientSocketId) {
                          socket.to(recipientSocketId).emit("call-timeout", { callerId });
                      }
                  }
  
                  // Mark both users as no longer in a call
                  delete userSocketInCall[callerId];
                  delete userSocketInCall[recipientId];
              }, 30000); // 30 seconds timeout
  
              // Mark both users as in a call
              userSocketInCall[callerId] = true;
              userSocketInCall[recipientId] = true;
              callback({ success: true, message: "Call initiated." });
  
              // Clear timeout if the call is accepted
              socket.on("accept-call", () => clearTimeout(timeout));
          } else {
              // If the recipient is not online, notify the caller
              callback({ success: false, message: "Recipient is not online." });
          }
      } catch (error) {
          console.error("Error saving call history:", error);
          return callback({ success: false, message: "Failed to initiate call." });
      }
  });



    // Accept a call
    socket.on("accept-call", async ({callHistoryId,recipientId, callerId, channelName}, callback) => {
      const callerSocketId = userSocketMap[callerId];
      if(callerSocketId){
       

        try {
          // Update the call history status to "accepted"
          await callAccepted(callHistoryId)

          // Notify the caller that the call is accepted
          socket.to(callerSocketId).emit("call-accepted",{recipientId, channelName, callHistoryId})
        } catch (error) {
          callback({status: false, message: "something wrong to update accepted message call."})
        }
      }
    });




    // Reject a call
    socket.on("reject-call",async ({callHistoryId, recipientId, callerId}) => {
      const callerSocketId = userSocketMap[callerId];
      // Notify the caller about the rejection
      if(callerSocketId){
        // Update the call history status to "missed"
        await rejectCall(callHistoryId);

        // Notify the caller that the call is rejected
        socket.to(callerSocketId).emit("call-rejected", {recipientId});
      }

      
    })



    // End a Call
    socket.on("end-call", async({callHistoryId, callerId, recipientId}) => {
      const callerSocketId = userSocketMap[callerId];
      const recipientSocketId = userSocketMap[recipientId]

      // Notify both participants about the call ending
      if(callerSocketId){
        socket.to(callerSocketId).emit("call-ended", {userId: recipientId})
      }
      if(recipientSocketId){
        socket.to(recipientSocketId).emit("call-ended", {userId: callerId});
      }

      // Update the database
      await callEnded(callHistoryId)
      // Clear busy state
      userSocketInCall[callerId] = false;
      userSocketInCall[recipientId] = false;
    })



    // Toggle Mute/Unmute Audio
    socket.on("toggle-audio", ({channelName, userId, isMuted}) => {
      const targetSocketId = userSocketMap[userId];
      if(!targetSocketId){
        console.error(`No socket found for user ${userId}`);
        return
      }
      const room = channelName || targetSocketId;
      socket.to(room).emit("audio-toggled", { userId, isMuted})
    })



    // Toggle Enable/Disable Video
    // socket.on("toggle-video", ({channelName, userId, isVideoEnabled}) => {
    //   const targetSocketId = userSocketMap[userId];
    //   if(!targetSocketId){
    //     console.error(`No socket found for user ${userId}`);
    //     return
    //   }
    //   const room = channelName || targetSocketId;
    //   socket.to(room).emit("video-toggled", {userId, isVideoEnabled});
    // });



    // ========================== Group Call event ============================
    // Join Group Call
    socket.on("join-group-call", ({ channelName, userId }) => {
      socket.join(channelName);
      console.log(`User ${userId} joined group call ${channelName}`);
      
      socket.to(channelName).emit("user-joined", { userId });
    });



    // Leave Group Call
    socket.on("leave-group-call", ({ channelName, userId }) => {
      socket.leave(channelName);
      console.log(`User ${userId} left group call ${channelName}`);
      
      socket.to(channelName).emit("user-left", { userId });
    });



    // Mute/Unmute in Group Call
    socket.on("toggle-audio-group", ({ channelName, userId, isMuted }) => {
      if (!channelName) {
        console.error("Channel name is required for group audio toggling.");
        return;
      }
      socket.to(channelName).emit("audio-toggled-group", { userId, isMuted });
    });



    // Enable/Disable Video in Group Call
    socket.on("toggle-video-group", ({ channelName, userId, isVideoEnabled }) => {
      if (!channelName) {
        console.error("Channel name is required for group video toggling.");
        return;
      }
      socket.to(channelName).emit("video-toggled-group", { userId, isVideoEnabled });
    });

    // typeing start/stop event
    socket.on('typing',async ({chatType, chatId, sender, isTypeing}) => {
      // when isTypeing = true ? user start typeing : user stop typeing
      if(chatType === 'one-to-one'){
        // fetch participants of the one-to-one chat
        const chat = await chatSchema.findById(chatId)
        if(!chat){
          console.log(`Chat not found: ${chatId}`);
          socket.emit("typeing-error", "Chat not found")
          return
        }
        
        const recipientId = chat.participants.find((id) => id.toString() !== sender);
        if(recipientId){
          const recipientSocketId = userSocketMap[String(recipientId)];
          console.log("recipientSocketId...",recipientSocketId)
          socket.to(recipientSocketId).emit('typing_status',{
            chatType,
            chatId,
            sender,
            isTypeing
          })
        }
      }else if(chatType === "group"){
        // fetch members of the group chat
        const group = await chatSchema.findById(chatId);
        if(!group){
          console.log(`group not found: ${chatId}`)
          socket.emit('typeing-error',"group not found");
          return
        }

        group.participants.forEach((member) => {
          if(member.toString() !== sender){
            const memberSocketId = userSocketMap[member.toString()];
            if(memberSocketId){
              socket.to(memberSocketId).emit('typing_status',{
                chatType,
                chatId,
                sender,
                isTypeing
              })
            }
          }
        })
      }
    })
    // Handle Group Call Token Generation
    // socket.on("request-group-token", ({ userId, channelName, uid }, callback) => {
    //   try {
    //     const token = generateAgoraToken(APP_ID, APP_CERTIFICATE, channelName, uid);
    //     if (token) {
    //       callback({ success: true, token });
    //     } else {
    //       callback({ success: false, message: "Failed to generate token" });
    //     }
    //   } catch (error) {
    //     callback({ success: false, message: error.message });
    //   }
    // });


    // Handle new Message
  // socket.on('send_message', async (data) => {
  //   const { sender, receiver, message, files } = data;
  //   const senderInfo = await userSchema.findById(sender).select("_id userName");
  //   const receiverInfo = await userSchema.findById(receiver).select("_id userName");

  //   // Check if a chat exists between the sender and receiver
  //   let chat = await chatSchema.findOne({
  //     isGroup: false,
  //     participants: {$all: [sender, receiver]}
  //   });

  //   if (!chat) {
  //     // Create a new chat if none exists
  //     chat = new chatSchema({
  //       isGroup: false,
  //       participants: [
  //         sender, receiver
  //       ],
  //     });
  //     await chat.save();
  //   }


  //   // handle the file if provided
  //   let fileId = null;
  //   if(files){
  //     try {
  //       // Decode Base64 file data and save it to the server
  //       const buffer = Buffer.from(files.data.split(',')[1], 'base64');
  //       const folder = files.type.startsWith('image/')
  //       ? 'images'
  //       : files.type.startsWith('video/')
  //       ? 'videos'
  //       : files.type.startsWith('audio/')
  //       ? 'audio'
  //       : 'documents';
  //       const filePath = `./assets/${folder}/${Date.now()}-${files.name}`;
        
  //       // Save the file locally
  //       fs.writeFileSync(filePath, buffer);

  //       // Save the file metadata in the database
  //       const newFile = new fileSchema({
  //         type: folder.slice(0, -1), // 'image', 'video', 'audio', or 'document'
  //         filePath,
  //         messageId: null, // Will be linked later
  //       });

  //       const savedFile = await newFile.save();
  //       fileId = savedFile._id;

  //     } catch (error) {
        
  //     }
  //   }
  //   // Save message to the database
  //   const chatMessage = new messageSchema({
  //     chatId: chat._id,
  //     sender,
  //     content: message,
  //     type: files ? 'mixed' : 'text',
  //     fileIds: fileId ? [fileId] : [],
  //   });
  //   await chatMessage.save();

  //   // Update the chat's lastMessage and increment unreadCount for the receiver
  //   await chatSchema.findByIdAndUpdate(chat._id, {
  //     lastMessage: chatMessage._id,
  //     // $inc: { unreadCount: 1 },
  //   });

  //   // Emit the message to the receiver if online
  //   const receiverSocketId = userSocketMap[receiver];
  //   if (receiverSocketId) {
  //     io.to(receiverSocketId).emit('receive_message', {
  //       senderInfo,
  //       receiverInfo,
  //       message,
  //       chatId: chat._id,
  //       messageId: chatMessage._id,
  //       timestamp: chatMessage.createdAt,
  //       file: fileId ? { id: fileId, name: files.name, type: files.type } : null,
  //     });
  //   }
  // });

  */

    socket.on("disconnect", () => {
      for (const userId in userSocketMap) {
          if (userSocketMap[userId] === socket.id) {
              delete userSocketMap[userId];
              socket.broadcast.emit("user-offline", { userId });
              break;
          }
      }
    });

  });
}


// export const initDemoSocketHandlers = (io: Server) => {
//   io.on('connection', (socket: Socket) => {
//     console.log('A user connected:', socket.id);

//     // Handle user login and save socket ID
//     socket.on('login', (userId: string) => {
//       userSocketMap[userId] = socket.id;
//       console.log(`User ${userId} logged in with socket ID ${socket.id}`);
//     });

//     // Handle sending messages
//     // socket.on('send_message', async (data) => {
//     //   const { sender, receiver, message } = data;
//     //   const senderInfo = await User.findById(sender).select("_id firstName");
//     //   const receiverInfo = await User.findById(receiver).select("_id firstName");

//     //   // Check if a chat exists between the sender and receiver
//     //   let chat = await Chat.findOne({
//     //     type: 'single',
//     //     participants: {
//     //       $all: [
//     //         { $elemMatch: { user: sender } },
//     //         { $elemMatch: { user: receiver } },
//     //       ],
//     //     },
//     //   });
  
//     //   if (!chat) {
//     //     // Create a new chat if none exists
//     //     chat = new Chat({
//     //       type: 'single',
//     //       participants: [
//     //         { user: new mongoose.Types.ObjectId(sender), role: 'member' },
//     //         { user: new mongoose.Types.ObjectId(receiver), role: 'member' },
//     //       ],
//     //     });
//     //     await chat.save();
//     //   }

//     //   // Save message to the database
//     //   const chatMessage = new Message({
//     //     chat: chat._id,
//     //     sender: new mongoose.Types.ObjectId(sender),
//     //     content: message,
//     //   });
//     //   await chatMessage.save();

//     //   // Update the chat's lastMessage and increment unreadCount for the receiver
//     //   await Chat.findByIdAndUpdate(chat._id, {
//     //     lastMessage: chatMessage._id,
//     //     $inc: { unreadCount: 1 },
//     //   });

//     //   // Emit the message to the receiver if online
//     //   const receiverSocketId = userSocketMap[receiver];
//     //   if (receiverSocketId) {
//     //     io.to(receiverSocketId).emit('receive_message', {
//     //       senderInfo,
//     //       receiverInfo,
//     //       message,
//     //       chatId: chat._id,
//     //       messageId: chatMessage._id,
//     //       timestamp: chatMessage.createdAt,
//     //     });
//     //   }
//     // });

//     // Handle user disconnect
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//       for (const userId in userSocketMap) {
//         if (userSocketMap[userId] === socket.id) {
//           delete userSocketMap[userId];
//           break;
//         }
//       }
//     });
//   });
// };



