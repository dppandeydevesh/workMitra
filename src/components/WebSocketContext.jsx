import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API_BASE_URL } from '../config';

const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Track the logged-in user profile dynamically
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  // Expose a helper to trigger reconnects when a user logs in
  const refreshUserSession = () => {
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  };

  useEffect(() => {
    // Sync session across tabs (storage fires in OTHER tabs only) …
    const handleStorageChange = () => {
      refreshUserSession();
    };
    window.addEventListener('storage', handleStorageChange);
    // … and within THIS tab, where login uses SPA navigation (no reload).
    // useLoginPage dispatches "auth:login" after writing user/accessToken so the
    // socket connects immediately instead of waiting for a manual page refresh.
    const handleAuthLogin = () => {
      refreshUserSession();
    };
    window.addEventListener('auth:login', handleAuthLogin);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:login', handleAuthLogin);
    };
  }, []);

  const connectWebSocket = () => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return; // Already connecting or connected
    }

    const getWsUrl = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (API_BASE_URL) {
        const host = API_BASE_URL.replace(/^https?:\/\//, '');
        return `${protocol}//${host}`;
      }
      return `${protocol}//${window.location.host}`;
    };

    const wsUrl = getWsUrl();
    console.log('Opening global socket at:', wsUrl);
    const wsSocket = new WebSocket(wsUrl);
    socketRef.current = wsSocket;

    wsSocket.onopen = () => {
      console.log('Global WebSocket connected successfully!');
      reconnectAttemptsRef.current = 0;
      wsSocket.send(
        JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('accessToken'),
        })
      );
    };

    wsSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status' && data.status === 'connected') {
          setWsConnected(true);
          return;
        }

        // Distribute message payload to all active listeners
        listenersRef.current.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.error('Error invoking listener:', e);
          }
        });
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    wsSocket.onclose = (event) => {
      setWsConnected(false);
      console.log('Global WebSocket connection closed. Code:', event.code);

      // Reconnect with exponential backoff if logged in. After the cap is
      // reached, stop the timer loop but leave recovery to the online/
      // visibilitychange listeners below — never give up permanently.
      if (user && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        console.log(`Reconnecting global socket in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };

    wsSocket.onerror = (err) => {
      console.error('Global WebSocket connection error:', err);
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Recovery paths after the backoff loop exhausts its attempts: when the
    // network comes back or the user returns to the tab, reset the counter
    // and try again. Without these, 5 failed attempts meant a dead socket
    // until a full page reload.
    const handleRecovery = () => {
      if (
        document.visibilityState === 'hidden' ||
        (socketRef.current &&
          (socketRef.current.readyState === WebSocket.OPEN ||
            socketRef.current.readyState === WebSocket.CONNECTING))
      ) {
        return;
      }
      reconnectAttemptsRef.current = 0;
      connectWebSocket();
    };
    window.addEventListener('online', handleRecovery);
    document.addEventListener('visibilitychange', handleRecovery);

    return () => {
      window.removeEventListener('online', handleRecovery);
      document.removeEventListener('visibilitychange', handleRecovery);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Expose register/unregister listener helpers
  const addListener = (callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  };

  const sendMessage = (payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn('Unable to send websocket payload. Connection is offline.');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        wsConnected,

        socket: socketRef.current,
        addListener,
        sendMessage,
        refreshSession: refreshUserSession,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
