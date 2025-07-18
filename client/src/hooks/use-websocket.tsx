import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
};

type UseWebSocketOptions = {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
};

type WebSocketStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'RECONNECTING';

export function useWebSocket(options?: UseWebSocketOptions) {
  const { toast } = useToast();
  const [status, setStatus] = useState<WebSocketStatus>('CLOSED');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesQueue = useRef<WebSocketMessage[]>([]);
  
  const autoReconnect = options?.autoReconnect ?? true;
  const reconnectDelay = options?.reconnectDelay ?? 5000;
  const [wsSupported, setWsSupported] = useState<boolean>(typeof WebSocket !== 'undefined');
  
  const connect = useCallback(() => {
    // If WebSockets aren't supported, don't try to connect
    if (!wsSupported) {
      console.log('WebSockets are not supported in this environment');
      setStatus('CLOSED');
      return;
    }
    
    // Close existing socket if it exists
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (error) {
        console.error('Error closing existing WebSocket connection:', error);
      }
    }
    
    setStatus('CONNECTING');
    
    // Determine the correct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket URL:', wsUrl);
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = (event) => {
        setStatus('OPEN');
        options?.onOpen?.(event);
        
        // Send any queued messages
        if (messagesQueue.current.length > 0) {
          messagesQueue.current.forEach(msg => {
            socket.send(JSON.stringify(msg));
          });
          messagesQueue.current = [];
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          options?.onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        options?.onError?.(event);
        
        toast({
          title: 'WebSocket Error',
          description: 'There was an error with the WebSocket connection.',
          variant: 'destructive',
        });
      };
      
      socket.onclose = (event) => {
        setStatus('CLOSED');
        options?.onClose?.(event);
        
        if (autoReconnect) {
          setStatus('RECONNECTING');
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setStatus('CLOSED');
      
      if (autoReconnect) {
        setStatus('RECONNECTING');
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    }
  }, [autoReconnect, options, reconnectDelay, toast]);
  
  const sendMessage = useCallback((type: string, data?: any) => {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    
    // If WebSockets aren't supported, return false immediately
    if (!wsSupported) {
      console.log('WebSockets not supported, would have sent:', message);
      return false;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      // Queue the message to be sent when the connection is established
      messagesQueue.current.push(message);
      
      // If socket is closed, try to reconnect
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
      
      return false;
    }
  }, [connect, wsSupported]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setStatus('CLOSED');
  }, []);
  
  // Set up ping interval to keep connection alive
  useEffect(() => {
    if (status === 'OPEN') {
      const pingInterval = setInterval(() => {
        sendMessage('ping');
      }, 30000); // Send ping every 30 seconds
      
      return () => {
        clearInterval(pingInterval);
      };
    }
  }, [status, sendMessage]);
  
  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    status,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}