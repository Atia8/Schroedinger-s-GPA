import Router from "./router";
import { SocketProvider } from './contexts/SocketContext';

export default function App() {
  return (
    <SocketProvider>
      <Router />
    </SocketProvider>
  );
}