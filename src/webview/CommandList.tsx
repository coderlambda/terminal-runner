import { VSCodeButton, VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import React from 'react';
interface vscode {
    postMessage(message: any): void;
}
// declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

interface CommandListProps {
    readonly commands: Object;
}

function CommandList (props: CommandListProps) {
    console.log(props.commands);
    const elements = [];
    const commandGroups = props.commands;

    for (let group in commandGroups) {
        const groupItem = commandGroups[group];
        const groupConfig = groupItem['config'];
        const groupRootPath = (groupConfig && groupConfig['path']) || '';
        const cmds = [];
        for (let cmd in groupItem['commands']) {
            const cmdItem = groupItem['commands'][cmd];
            const terminalId = (groupConfig && groupConfig['terminal-id']) || undefined;
            const cmdPath = cmdItem['path'] || '';
            console.log(cmdItem);
            cmds.push(<div className='mb-2'>
                <VSCodeButton 
                    className='cmd-btn'
                    onClick={ () => {  
                        vscode.postMessage({ 
                            command: 'run-cmd', 
                            text: cmdItem['cmd'], 
                            terminalId: (groupItem['config'] && groupItem['config']['terminal-id']) || undefined,
                            path: groupRootPath + cmdPath
                        });} } 
                    title={cmdItem['cmd']}
                ><div className='cmd-btn-txt'>{ cmd } {cmdPath !== '' ? <span className='cmd-path'>[ {cmdPath} ]</span> : ''}</div> </VSCodeButton>
            </div>);
        }
        
        let groupRootPathElem;
        if (groupRootPath !== '') {
            groupRootPathElem = <div className='group-root-path' title={ groupRootPath }>{ groupRootPath} </div>;
        }
        elements.push(<div>
            <div className='group-head'><div className='group-name'>{ group }</div>{ groupRootPathElem }</div>
            { ...cmds }
            <VSCodeDivider></VSCodeDivider>
        </div>);
    }

    return <div>
        { ...elements }
    </div>;
}

export default CommandList;
