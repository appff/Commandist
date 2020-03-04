import * as ConfigurationLoader from '../control/configuration-loader';

import { Interfaces } from '../control/interfaces';
import { Md5 } from 'ts-md5/dist/md5';
import { extractIcon } from 'exe-icon-extractor';
import * as fs from 'fs';

const Configuration: Interfaces.Configuration = ConfigurationLoader.Load();

const ApplicationName: string = 'launcher';
const ApplicationCompartible: Array<string> = ['win32'];

const init = () => {
    if(!ApplicationCompartible.includes(process.platform)) return;
    const UpdateCacheData = (): void => {
        const IconCachePath: string = `./applicationData/Launcher.v1/Icons/${process.platform}`;
        switch(process.platform) {
            case 'win32': {
                const getApplicationsList = (path: string): Array<string> => {
                    let output: Array<string> = [];
                    fs.readdirSync(path).forEach((program) => {
                        if(!(/\.[A-Za-z]+/).test(program)) output = [ ...output, ...getApplicationsList(`${path}\\${program}`) ];
                        else output.push(`${ path }\\${ program }`);
                    });
                    return output;
                }
                const Applications: Array<Interfaces.LauncherV1Applications> = getApplicationsList(`C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs`).map((program) => ({
                    Name: program.substring(program.lastIndexOf('\\') + 1, program.lastIndexOf('.')),
                    LnkPath: program,
                    ActualPath: require('child_process').spawnSync('powershell.exe', [ `-c`, `(New-Object -COM WScript.Shell).CreateShortcut("${ program }").TargetPath` ]).output[1].toString().replace(/\r\n/g, ''),
                    LnkPathMD5: new Md5().appendStr(program).end() as string
                }));
                if(!fs.existsSync(IconCachePath)) fs.mkdirSync(IconCachePath, { recursive: true });
                Applications.forEach((program) => {
                    try {
                        fs.writeFileSync(`${IconCachePath}/${program.LnkPathMD5}.ico`, extractIcon(program.ActualPath, 'large'));
                    } catch(Exception) {
                        console.log(program, Exception);
                    }
                });
                fs.writeFileSync(`${IconCachePath}/win32.json`, JSON.stringify(Applications));
            }
        }
        setTimeout(UpdateCacheData, 60000);
    }
    UpdateCacheData();
}

init();