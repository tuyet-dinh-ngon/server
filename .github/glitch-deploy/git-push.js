function upload2Git(urlGit, workFolder) {
  urlGit = urlGit.trim();
  const parseUrlGit = urlGit.split('/');
  const repo = parseUrlGit[4]

  const data = {
    branch: 'master',
    repo_email: `${repo}@outlook.com`,
  }

  return new Promise(async (resolve, reject) => {
    const shell = require('shelljs');
    const fs = require('fs');
    // await shell.exec('git config --unset-all --global user.name', {silent:true});
    // await shell.exec('git config --unset-all --global user.email', {silent:true});
    // await shell.exec(`git config --global user.name "${ userName }"`, {silent:true});
    // await shell.exec(`git config --global user.email "${ data.repo_email }"`, {silent:true});
    if (!shell.which('git')) {
      console.log('Loi nghiem trong: Can cai dat git de su dung tool!');
      // shell.exit(1);
      reject(7);
    } else {
      if (!process.cwd().includes(workFolder)) shell.cd(workFolder, { silent: true });
      try {
        let README_data = fs.readFileSync('./README.md', { encoding: 'utf8', flag: 'r' });
        README_data = README_data.replace(README_data.split('====')[0], `updated on [${new Date().toLocaleString()}] by ${workSpace}\n`);
        fs.writeFileSync("./README.md", README_data);
      } catch {
        console.log('[Main]: khong co file README')
      }
      shell.exec('git config --unset-all --global user.name', { silent: true });
      shell.exec('git config --unset-all --global user.email', { silent: true });
      shell.exec(`git config --global user.name "${repo}"`, { silent: true });
      shell.exec(`git config --global user.email "${data.repo_email}"`, { silent: true });
      shell.exec('rm -rf .git', { silent: true }, (coderm, stdoutrm, stderrrm) => {
        if (coderm === 0) {
          // socket.emit('gituploadlog', 'Delete .git success');
          shell.exec('git init', { silent: true }, (codeinit, stdoutinit, stderrinit) => {
            if (codeinit === 0) {
              // dbo.collection(process.env.DB_COLLECTION).updateOne({ ID: ID }, { $set: { taskinfo: 'Chuẩn bị upload file lên Github' } });
              // socket.emit('gituploadlog', `Create .git success \n ${ stdoutinit }`);
              // shell.exec('git checkout -- .')
              if (shell.exec('git add .', { silent: true }).code === 0) {
                // socket.emit('gituploadlog', 'Git add . success');
                shell.exec(`git remote add origin ${urlGit}`, { silent: true }, (coderemote, stdoutremote, stderrremote) => {
                  if (coderemote === 0) {
                    // socket.emit('gituploadlog', 'Git remote add origin success');
                    shell.exec(`git checkout -b ${data.branch}`, { silent: true }, (codecheckout, stdoutcheckout, stderrcheckout) => {
                      if (codecheckout === 0) {
                        // socket.emit('gituploadlog', stderrcheckout); "updated on [${ new Date().toLocaleString() }]"
                        shell.exec(`git commit -m "[${new Date().toLocaleString()}]"`, { silent: true }, (codecommit, stdoutcommitt, stderrcommit) => {
                          if (codecommit === 0) {
                            // `Git commit to branch [${branch }] success \n ${ stdoutcommitt }`
                            // socket.emit('gituploadlog', `Git commit to branch [${branch }] success`);
                            // dbo.collection(process.env.DB_COLLECTION).updateOne({ ID: ID }, { $set: { taskinfo: 'Commit thành công, chuẩn bị upload' } });
                            shell.exec(`git push origin ${data.branch} -f`, { silent: true }, (codepush, stdoutpush, stderrpush) => {
                              if (codepush === 0) {
                                // socket.emit('gituploadlog', `Git push origin ${ branch } success \n ${ stderrpush }`);
                                // dbo.collection(process.env.DB_COLLECTION).updateOne({ ID: ID }, { $set: { taskinfo: 'Upload file lên Github thành công.' } });
                                resolve();
                              } else {
                                console.log(`push to ${data.branch} error: ${stdoutpush} stderrpush: ${stderrpush}`);
                                // shell.exit(1);
                                reject(6);
                              }
                            })
                          } else {
                            console.log(`commit error: ${stdoutcommitt}`);
                            // shell.exit(1);
                            reject(5);
                          }
                        })
                      } else {
                        console.log(`switch to branch [${data.branch}] error: ${stdoutcheckout}`);
                        // shell.exit(1);
                        reject(4);
                      }
                    });
                  } else {
                    console.log(`add remote error: ${stdoutremote}`);
                    // shell.exit(1);
                    reject(3);
                  }
                })
              } else {
                console.log('add error');
                // shell.exit(1);
                reject(2);
              }
            } else {
              console.log(`init error: ${codeinit}`);
              // shell.exit(1);
              reject(1);
            }
          })
        } else {
          console.log(`delete .git error: ${coderm}`);
          // shell.exit(1);
          reject(0);
        }
      })
    }
  })
}

module.exports = {
  upload2Git
}