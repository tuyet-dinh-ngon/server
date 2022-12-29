const http = require('http');
const urlParse = require('url').parse
const { spawn, execSync } = require('node:child_process');
const { rmSync, writeFileSync, /*existsSync*/ } = require('fs')

rmSync('./.git', { recursive: true, force: true });
execSync(`git init && git config receive.denyCurrentBranch updateInstead && echo '/usr/bin/refresh' > .git/hooks/post-receive && chmod +x .git/hooks/post-receive`)
// const deplay = async (milliseconds) => new Promise(r => setTimeout(r, milliseconds));

const shellExec = async (cmd, options) => {
  try {
    const stdout = []
    return new Promise((resolve, reject) => {
      const processRun = spawn(cmd, { shell: true });
      if (options.stdout) {
        processRun.stdout.on('data', (data) => {
          stdout.push(data.toString())
        });
      }
      if (options.log) {
        processRun.stdout.on('data', (data) => {
          console.log('process log:', data.toString());
        });
      }

      processRun.on('error', (code) => {
        reject(code)
      });
      processRun.on('close', (code) => {
        resolve({ code: code, stdout: stdout.join('\n') })
      });
    })
  } catch (error) {
    return { code: 999 }
  }
}

const runBrowser = async (runArg, log) => {
  const processRun = spawn(`bash -c "exec -a redocoem node run.js ${runArg || ""} &"`, { shell: true });
  if (log) {
    processRun.stdout.on('data', (data) => {
      console.log('[BROWSER RUN]:', data.toString())
    });
  }

  processRun.on('error', (code) => {
    console.log('[BROWSER RUN]: error with code', code)
  });
  processRun.on('close', (code) => {
    console.log('[BROWSER RUN]: close with code', code)
  });
};

const runBrowserWin = async (runArg, log) => {
  const processRun = spawn(`bash -c "exec -a redocoem node run_win.js ${runArg || ""} &"`, { shell: true });
  if (log) {
    processRun.stdout.on('data', (data) => {
      console.log('[BROWSER RUN]:', data.toString())
    });
  }

  processRun.on('error', (code) => {
    console.log('[BROWSER RUN]: error with code', code)
  });
  processRun.on('close', (code) => {
    console.log('[BROWSER RUN]: close with code', code)
  });
};

const resJson = (res, json) => res.end(JSON.stringify(json));

http.createServer(async function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const url = urlParse(req.url, true)
  let { runArg, log, cmd, async, urlFile, nameFile, pathFile, browersConfig, dataRun } = url.query;
  switch (url.pathname) {
    // lấy địa chỉ IP của máy chủ
    case "/ip":
      try {
        const listServerCheckIp = [
          "ifconfig.me",
          "api.ipify.org",
          "ipinfo.io/ip",
          "ipecho.net/plain",
        ];
        const serverCheckIp =
          listServerCheckIp[Math.floor(Math.random() * listServerCheckIp.length)];
        const runGetIp = await shellExec(`curl ${serverCheckIp}`, { stdout: true });
        if (runGetIp.code === 0)
          return resJson(res, {
            error: null,
            status: true,
            data: { ip: runGetIp.stdout, server: serverCheckIp },
          });
        resJson(res, { error: 1, status: true, message: "Không thể lấy địa chỉ IP!" });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/shell":
      if (!cmd)
        return resJson(res, {
          error: 1,
          status: true,
          message: "Thiếu giá trị cho cmd!",
        });

      async = async ? true : false;

      try {
        const runCmd = async ? shellExec(cmd, { stdout: false }) : await shellExec(cmd, { stdout: true });

        if (async)
          return resJson(res, {
            error: null,
            status: true,
            data: { async, stdout: null },
          });
        if (runCmd.code === 0)
          return resJson(res, {
            error: null,
            status: true,
            data: { async, stdout: runCmd.stdout },
          });
        resJson(res, { error: 1, status: true, message: "Thực thi lệnh thất bại!" });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/ping":
      resJson(res, { pong: true });
      break;

    case "/run":
      try {
        if (!(await shellExec("pidof redocoem", { stdout: true })).stdout) {
          try {
            if (dataRun) writeFileSync("dataRun", dataRun, { encoding: 'utf8', flag: 'w' })
            // if (!existsSync(__dirname + '/node_modules/puppeteer')) {
            //     console.log('[MAIN]: Reinstall package');
            //     await shellExec('npm i ' + ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1'].join(' '), { stdout: false })
            //     await deplay(10000)
            // }
            runBrowser(runArg, log);
            return resJson(res, {
              error: null,
              status: true,
              message: "running",
            });
          } catch (error) {
            resJson(res, {
              error: 1,
              status: true,
              message: "Thực thi lệnh thất bại!",
            });
          }
        }

        return resJson(res, {
          error: 1,
          status: true,
          message: "Có một lệnh khác đang được thực thi!",
        });
      } catch (e) {
        console.log(e);
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/runWithClearn":
      try {

        rmSync('./test-browser-proxy', { recursive: true, force: true });
        // shell.mkdir("-p", "./test-browser-proxy");

        if (!(await shellExec("pidof redocoem", { stdout: true })).stdout) {
          try {
            if (dataRun) writeFileSync("dataRun", dataRun, { encoding: 'utf8', flag: 'w' })
            // if (!existsSync(__dirname + '/node_modules/puppeteer')) {
            //     console.log('[MAIN]: Reinstall package');
            //     await shellExec('npm i ' + ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1'].join(' '), { stdout: false })
            //     await deplay(10000)
            // }
            runBrowser(runArg, log);
            return resJson(res, {
              error: null,
              status: true,
              message: "running",
            });
          } catch (error) {
            resJson(res, {
              error: 1,
              status: true,
              message: "Thực thi lệnh thất bại!",
            });
          }
        }

        return resJson(res, {
          error: 1,
          status: true,
          message: "Có một lệnh khác đang được thực thi!",
        });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;
    case "/runWin":
      try {
        if (!(await shellExec("pidof redocoem", { stdout: true })).stdout) {
          try {
            if (dataRun) writeFileSync("dataRun", dataRun, { encoding: 'utf8', flag: 'w' })
            // if (!existsSync(__dirname + '/node_modules/puppeteer')) {
            //     console.log('[MAIN]: Reinstall package');
            //     await shellExec('npm i ' + ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1'].join(' '), { stdout: false })
            //     await deplay(10000)
            // }
            runBrowserWin(runArg, log);
            return resJson(res, {
              error: null,
              status: true,
              message: "running",
            });
          } catch (error) {
            resJson(res, {
              error: 1,
              status: true,
              message: "Thực thi lệnh thất bại!",
            });
          }
        }

        return resJson(res, {
          error: 1,
          status: true,
          message: "Có một lệnh khác đang được thực thi!",
        });
      } catch (e) {
        console.log(e);
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/runWinWithClearn":
      try {

        rmSync('./test-browser-proxy', { recursive: true, force: true });
        // shell.mkdir("-p", "./test-browser-proxy");

        if (!(await shellExec("pidof redocoem", { stdout: true })).stdout) {
          try {
            if (dataRun) writeFileSync("dataRun", dataRun, { encoding: 'utf8', flag: 'w' })
            // if (!existsSync(__dirname + '/node_modules/puppeteer')) {
            //     console.log('[MAIN]: Reinstall package');
            //     await shellExec('npm i ' + ['ghost-cursor@1.1.15', 'puppeteer@18.0.5', 'puppeteer-extra@3.3.4', 'puppeteer-extra-plugin-stealth@2.11.1'].join(' '), { stdout: false })
            //     await deplay(10000)
            // }
            runBrowserWin(runArg, log);
            return resJson(res, {
              error: null,
              status: true,
              message: "running",
            });
          } catch (error) {
            resJson(res, {
              error: 1,
              status: true,
              message: "Thực thi lệnh thất bại!",
            });
          }
        }

        return resJson(res, {
          error: 1,
          status: true,
          message: "Có một lệnh khác đang được thực thi!",
        });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/kill":
      try {
        if ((await shellExec("pkill -f redocoem", { stdout: false })).code === 0)
          if (!(await shellExec("pidof redocoem", { stdout: true })).stdout)
            return resJson(res, {
              error: null,
              status: true,
              message: "killed",
            });
          else {
            shellExec("pkill -f redocoem", { stdout: false })
            return resJson(res, {
              error: 1,
              status: true,
              message: "Đã thực hiện đóng tiền trình nhưng phát sinh lỗi, chạy lại một lần nữa!",
            });
          }

        resJson(res, { error: 1, status: true, message: "Không thể đóng tiến trình!" });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/update":
      if (!(urlFile && nameFile))
        return resJson(res, {
          error: 1,
          status: true,
          message: "Thiếu giá trị cần thiết như name, url, path!",
        });

      try {
        const runDownload = await shellExec(`curl --create-dirs -fsSL -o ${pathFile || "./"}${nameFile} ${urlFile}`, { stdout: false, })
        if (runDownload.code === 0)
          return resJson(res, {
            error: null,
            status: true,
            message: "downloaded",
          });
        resJson(res, { error: 1, status: true, message: "Tải file thất bại!" });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/refresh":
      try {
        if (
          (await shellExec(`refresh`, {
            stdout: false,
          })).code === 0
        )
          return resJson(res, {
            error: null,
            status: true,
            message: "restarting...",
          });
        resJson(res, { error: 1, status: true, message: "Làm mới máy chủ thẩt bại!" });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/browserConfig":
      if (!browersConfig)
        return resJson(res, {
          error: 1,
          status: true,
          message: "Thiếu giá trị cho browersConfig!",
        });
      try {

        writeFileSync("browserConfig.json", browersConfig, { encoding: 'utf8', flag: 'w' });
        return resJson(res, {
          error: null,
          status: true,
          message: "Đã update browser config!",
        });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/dataRun":
      if (!dataRun)
        return resJson(res, {
          error: 1,
          status: true,
          message: "Thiếu giá trị cho dataRun!",
        });
      try {

        writeFileSync("dataRun", dataRun, { encoding: 'utf8', flag: 'w' });
        return resJson(res, {
          error: null,
          status: true,
          message: "Đã update data run!",
        });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    case "/testTimeOut":
      try {

        writeFileSync("timeout.txt", '', { encoding: 'utf8', flag: 'w' });

        setInterval(() => {
          writeFileSync("timeout.txt", '+', { encoding: 'utf8', flag: 'a' });
        }, 1000)

        return resJson(res, {
          error: null,
          status: true,
          message: "Đang tính thời gian time out!",
        });
      } catch (e) {
        resJson(res, { error: 1, status: true, message: "Không thể thực hiện lệnh!" });
      }
      break;

    default:
      resJson(res, { status: true });
      break;
  }


}).listen(process.env.PORT || 3109, (err) => {
  if (err) {
    return console.log('[Server]: error start with: ', err)
  } else {
    return console.log('[Server]: on running')
  }
});