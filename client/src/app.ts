import jsftp from 'jsftp';
import fs from 'fs';
import util from 'util';

import { default as envInfo } from '../assets/env_info.json';

const targetFile: string = 'version.txt';
const asyncReadFile = util.promisify(fs.readFile);
let ftp: jsftp;

interface IFileInfo {
    name: string;
    type: number;
    size: string;
    owner: string;
    group: string;
}

async function getFtpFileList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        if (ftp == null) {
            reject('ftp is null');
        }
        ftp.ls('.', (err, res) => {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    });
}

async function getFtpFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (ftp == null) {
            reject('ftp is null');
        }
        ftp.get(filename, (err, socket) => {
            if (err) {
                reject(err);
            }
            let res: string = '';
            socket.on('data', data => {
                res += data.toString('utf8');
            });
            socket.on('close', err => {
                if (err) {
                    reject(err);
                }
                resolve(res);
            });
            socket.resume();
        });
    });
}

function initFtpClient() {
    let ftpInfo = envInfo.ftp_info;
    ftp = new jsftp({
        host: ftpInfo.host,
        port: ftpInfo.port,
        user: ftpInfo.user,
        pass: ftpInfo.pass,
    });
}

async function main() {
    try {
        initFtpClient();
        console.log('initFtpClient Ok.');

        //INFO: FTP 서버 파일 목록을 가져온다.
        let fileList = (await getFtpFileList()) as IFileInfo[];
        console.log('getFtpFileList Ok.');
        console.log(fileList);
        let isVersionFileExist: boolean = false;

        //INFO: FTP 서버 파일 중에 원하는 파일이 있는지 검사한다.
        for (let fileInfo of fileList) {
            if (fileInfo.name !== targetFile) {
                continue;
            }
            isVersionFileExist = true;
            break;
        }

        if (!isVersionFileExist) {
            throw new Error(targetFile + ' does not exist');
        }

        console.log('isVersionFileExist Ok.');

        //INFO: 원하는 파일을 서버로부터 읽어들인다.
        let version = await getFtpFile(targetFile);
        console.log('getFtpFile Ok.');

        console.log('version : ' + version);
    } catch (ex) {
        console.error(ex);
        process.exit(0);
    } finally {
        if (ftp != null) {
            ftp.destroy();
        }
    }
}
main();
