const upload_Md = require('./git-push.js');
const createNew_Md = require('./newCreate.js')
const shell = require('shelljs')
const queryString = require('query-string');
const axios = require("axios").default;
const axiosRetry = require('axios-retry');

setTimeout(() => {
  console.log('force exit');
  process.exit(0)
}, 30 * 60 * 1000);

axiosRetry(axios, {
  retries: 100,
  retryDelay: (retryCount) => {
    // console.log(`retry attempt: ${retryCount}`);
    return 3000 || retryCount * 1000;
  },
  retryCondition: (error) => {
    return error.response.status === 502;
  },
});


const listProject = `https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/mini-jumpy-topaz|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/adaptable-burnt-bacon|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/mercury-narrow-curio|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/eager-careful-band|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/jungle-different-brush|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/jeweled-exuberant-guide|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/necessary-grand-music|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/caring-lavender-hardboard|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/holly-treasure-pelican|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/battle-bright-soap|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/bloom-pewter-waitress|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/honey-quixotic-apatosaurus|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/zinc-buttered-attack|https://d0804848-c7f6-4c29-8304-457894ee308b@api.glitch.com/git/great-coal-bloom`.trim().split('|');

const delay = t => {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(true);
    }, t);
  });
};

(async () => {
  try {
    let accountNumber = 0;

    for (let i = 0; i < listProject.length; i++) {
      accountNumber = i + 1;
      try {
        const nameProject = listProject[i].split('/')[4]
        console.log('deploy', nameProject);
        createNew_Md.run(nameProject)
        await upload_Md.upload2Git(listProject[i].trim(), 'code4Delpoy');
        console.log(`account ${accountNumber} upload success ^_^`);

        axios
          .get(`https://eager-profuse-python.glitch.me/deploy?${queryString.stringify({
            email: listProject[i].trim() + ' true'
          })}`)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            if (error.response) {
              console.log(error.response.data);
            } else {
              console.log('Loi');
            }
          });

        if (i + 1 < listProject.length) await delay(1.8 * 60 * 1000);
      } catch (error) {
        console.log(`account ${accountNumber} upload fail ^_^`);
        axios
          .get(`https://eager-profuse-python.glitch.me/deploy?${queryString.stringify({
            email: listProject[i].trim() + ' false'
          })}`)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            if (error.response) {
              console.log(error.response.data);
            } else {
              console.log('Loi');
            }
          });
      }

      if (process.cwd().includes('code4Delpoy')) shell.cd('../', { silent: true });

    }

    await delay(20000)
    console.log('Done! exit')
    process.exit(0)

  } catch (err) {
    console.log(`error: ${err}`);
  }
})();