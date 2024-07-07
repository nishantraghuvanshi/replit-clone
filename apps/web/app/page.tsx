"use client"
import { useCallback, useEffect, useState } from "react";
import MyTerminal from "./_components/terminal"
import styles from "./page.module.css";
import FileTree from "./_components/tree";
import socket from "./_components/socket";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";


export default function Home() {

  const [fileTree, setFileTree] = useState({})
  const [selectedFile, setSelectedFile] = useState("")
  const [editorValue, setEditorValue] = useState("")
  const [selectedFileContent, setSelectedFileContent] = useState("")

  const isSaved = editorValue === selectedFileContent;

  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    const data = await response.json();
    setFileTree(data);
  }

    const getFileContent = useCallback(async () => {
      if (!selectedFile) return;
      const response = await fetch(
        `http://localhost:9000/files/content?path=${selectedFile}`
      );
      const data = await response.json();
      setSelectedFileContent(data.content);
    }, [selectedFile]);

  useEffect(() => {
    getFileTree();
    socket.on('file:refresh',getFileTree); 
    return () => {
      socket.off('file:refresh',getFileTree);
    }
  },[])


  useEffect(() => {
    if(selectedFileContent && selectedFile ){
      setEditorValue(selectedFileContent);
    }
  },[selectedFileContent, selectedFile])

  useEffect(() => {
    setEditorValue("");
  },[selectedFile])

  useEffect(() => {
    if(selectedFile){
      getFileContent();
    }
  },[selectedFile, getFileContent])

  useEffect(() => {
    setEditorValue(selectedFileContent);
  }, [selectedFileContent]);

  
  useEffect(() => {
    if(editorValue && !isSaved){
      const timer = setTimeout(() => {
        socket.emit('file:save', {path: selectedFile, content: editorValue});
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    } 
  } ,[editorValue, selectedFile, isSaved])

  return (
    <div className={styles.playground}>
      <div className={styles.codespace}>
        <div className={styles.files}>
          <FileTree
            tree={fileTree}
            onSelect={(path) => setSelectedFile(path)}
          />
        </div>
        <div className={styles.editor}>
          {selectedFile && (
            <span>
              <b>
              {selectedFile.replaceAll("/", " > ")}
              </b>
            </span>
          )} {isSaved ? "Saved" : "Saving..."}
          <AceEditor
            mode="javascript"
            theme="github"
            name="editor"
            fontSize={14}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            value={editorValue}
            onChange={(newValue) => setEditorValue(newValue)}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>
      <div className={styles.terminal}>
        <MyTerminal />
      </div>
    </div>
  );
}
