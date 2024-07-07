"use client"
import {Terminal as XTerminal} from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import socket from './socket';

const MyTerminal = () => {

    const terminalRef = useRef();

    useEffect(() => {
        const xterm = new XTerminal({
            cursorBlink: true,
            rows: 21,
            cols: 100,
            scrollOnUserInput: true,
            
        });
        xterm.open(document.getElementById('terminal'));
        xterm.onData((data) => {
            socket.emit('terminal:write', data);
        });

        socket.on('terminal:data', (data) => {
            xterm.write(data);
        });

        return () => {
            xterm.dispose();
            socket.off('terminal:data');
        }
    }, [])

  return (
    <div id='terminal' ref={terminalRef}>
        
    </div>
  )
}

export default MyTerminal;