import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class OnlineGameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  private queue: {Socket:Socket,token:string | string[]}[] = []; 
  private rooms: Map<string, Socket[]> = new Map(); 

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    const accessToken = client.handshake.query.access_token;
    this.queue.push({Socket : client,token: accessToken}); 
    this.pairClients(); 
    console.log(this.rooms);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeFromRoom(client); 
    this.removeFromQueue(client); 
    const roomId = this.getRoomId(client);
    //this.server.to(roomId).emit('disconnect', 'disconnect'); 
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string) {
    this.addToRoom(client, roomId); 
    client.join(roomId); 
    client.emit('joinedRoom', roomId); 
  }

  @SubscribeMessage('move')
  handleMove(client: Socket, moveData: any) {
    const roomId = this.getRoomId(client);
    this.server.to(roomId).emit('move', moveData); 
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, message: any) {
    const roomId = this.getRoomId(client);
    this.server.to(roomId).emit('message', message); 
  }

  @SubscribeMessage('joined')
  handleJoin(client: Socket, username: string) {
    const roomId = this.getRoomId(client);
    this.server.to(roomId).emit('joined',username ); 
  }
  

  @SubscribeMessage('time')
  handleTime(client: Socket, time: any) {
    const roomId = this.getRoomId(client);
    this.server.to(roomId).emit('time', time); 
  }

  private pairClients() {
    while (this.queue.length >= 2) { 
      const client1 = this.queue.shift()!;
      const client2 = this.queue.find(client => client.Socket.id !== client1.Socket.id && client.token !== client1.token);
      
      if (client2) {
        const roomId = `room-${Math.random().toString(36).substr(2, 5)}`;
        this.addToRoom(client1.Socket, roomId);
        this.addToRoom(client2.Socket, roomId);
        client1.Socket.join(roomId);
        client2.Socket.join(roomId);
        this.removeFromQueue(client1.Socket);
        this.removeFromQueue(client2.Socket);
        client1.Socket.emit('joinedRoom', {roomId, player: 1});
        client2.Socket.emit('joinedRoom', {roomId, player: 2});
      } else {
        this.queue.push(client1);
        break; 
      }
    }
}


  private addToRoom(client: Socket, roomId: string) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = [];
      this.rooms.set(roomId, room);
    }
    room.push(client);
  }

  private removeFromRoom(client: Socket) {
    this.rooms.forEach((clients, roomId) => {
      const index = clients.indexOf(client);
      if (index !== -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          this.rooms.delete(roomId);
        }
      }
    });
  }

  private removeFromQueue(client: Socket) {
    const index = this.queue.findIndex(item => item.Socket === client);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
}

  private getRoomId(client: Socket): string | undefined {
    for (const [roomId, clients] of this.rooms.entries()) {
      if (clients.includes(client)) {
        return roomId;
      }
    }
    return undefined;
  }

}
