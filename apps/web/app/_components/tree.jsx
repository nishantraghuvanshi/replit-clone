import React from 'react'
import "./components.style.css"

const FileTreeNode = ({fileName, nodes, onSelect, path}) =>{

    const isDirectory = !!nodes;

    return (
        <div
        onClick={(e)=>{
          e.stopPropagation();
          if(isDirectory){
            return
          }
          onSelect(path)
        }}
         style={{marginLeft:"10px"}}>
        <span className={isDirectory ? "" : "fileNode"}>{fileName}</span>
        <div>
            {nodes && fileName !== "node_modules" && 
            <ul>
                {Object.keys(nodes).map(child => (
                    <li key={child}>
                    <FileTreeNode 
                    onSelect={onSelect}
                    path={path + "/" + child}
                    fileName={child} 
                    nodes={nodes[child]} />
                    </li>
                )
                )}
                </ul>}
        </div>
        </div>
    )
}

const FileTree = ({tree, onSelect}) => {
  return (
    <FileTreeNode 
    onSelect={onSelect}
    fileName="/"
    nodes={tree}
    path=""
    />
  )
}

export default FileTree