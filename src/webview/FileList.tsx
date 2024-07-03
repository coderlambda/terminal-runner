import React, { FormEventHandler } from 'react';
import { provideVSCodeDesignSystem, vsCodeOption, vsCodeDropdown,} from "@vscode/webview-ui-toolkit";
provideVSCodeDesignSystem().register( vsCodeDropdown(), vsCodeOption());


export interface CommandFile {
    readonly fileName: string;
    readonly path: string;
    readonly content: string;
    readonly stat: string;
}

interface FileListProps {
    readonly fileList?: CommandFile[];
    readonly activeOptionId?: string;
    readonly onChange: (((newValue: string) => unknown) & FormEventHandler<HTMLElement>);
}

function FileList(props: FileListProps) {
    // const [optionList, setOptionList] = useState<ReactElement[]>([]);
    const changeHandler = (e: Event) => {
        const newValue = e.target?.value;
        if (newValue === props.activeOptionId) {
            return;
        }
        props.onChange(newValue);
    }

    const optionList = [];
    if (props.fileList) {
        for (let file of props.fileList) {
            if (file.path === props.activeOptionId) {
                optionList.push(<vscode-option key={file.path} value={file.path} selected onClick={ changeHandler }>
                        { file.fileName }
                    </vscode-option>);
            } else {
                optionList.push(<vscode-option key={file.path} value={file.path} onClick={ changeHandler }>
                        { file.fileName }
                    </vscode-option>);
            }
        }
    }
    return <vscode-dropdown value={props.activeOptionId}>
        { ...optionList }
    </vscode-dropdown>;
}

export default FileList;