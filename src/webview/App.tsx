import React, { useEffect, useState } from 'react';
import FileList, { CommandFile } from './FileList';
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import CommandList from './CommandList';
/*
    [{
        fileName: string
        fileUri: string,
        fileId: string,
        fileContent: {
            groupName: {
                commandList: {
                    commandLable: {
                        command: string
                    }
                }
            }
        }
    }]
*/
declare const vscode: vscode;

interface CommandListProps {
    readonly commands: Object;
}

function App() {
    const [fileList, setFileList] = useState<CommandFile[]>([]);
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [commands, setCommands] = useState<Object>();

    const handleFileLoadEvent = (event:MessageEvent<any>) => {
        const data = event.data;
        if (data.stat === 'success') {
            // let fList = [...fileList];
            fileList.push({
                fileName: data.fileName,
                path: data.path,
                content: data.content,
                stat: data.stat
            });
            setFileList(fileList);
            setSelectedFilePath(data.path);
            setCommands(data.content);
        }
    };

    useEffect(() => {
        window.addEventListener("message", event => {
            switch (event.data.type) {
                case 'cmd-file-loaded':
                    handleFileLoadEvent(event);
                    break;
            }
        });
        vscode.postMessage({
            command: "webwiew-ready"
        });
    }, []);

    return <div>
        <FileList 
            fileList={ fileList } 
            activeOptionId={ selectedFilePath }
            onChange={newValue => {

                const fileItem = fileList.find( f => f.path === newValue);
                if (fileItem) {
                    setSelectedFilePath(fileItem.path);
                    setCommands(fileItem.content);
                }
            }}>
        </FileList>
        <VSCodeButton onClick={() => {
            vscode.postMessage({
                command: "open-new-file"
              });
        }}>+</VSCodeButton>
        <CommandList commands={commands}></CommandList>
    </div>;
}

export default App;