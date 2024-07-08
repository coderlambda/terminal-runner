# Terminal Runner README

## Features

Use yaml file to group frequently used commands.
The commands will show as buttons. Click to run in the terminal.

### Usage
Create a file named `cmd.yaml` on the root of openning folder.
Below is an example of the content:
```yaml
Group Name: # Required. Group name.
    config: # Optional, config of the group
        path: /Users/username/ # Optional. Root path of the group. If provided, all commands will run after `cd [group path][cmd path]`
    commands: # Required. 
        Build package: # Required. Command button text.
            path: src # Optional. Relative path to run the command.
            cmd: build # Required. Command to run.
        Command 2:
            cmd: ls
Group Name 2:
    commands:
        Command 3:
            cmd: pwd
```

## Requirements

None

## Extension Settings

None

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Provide basic function

### 0.0.1

**Enjoy!**
