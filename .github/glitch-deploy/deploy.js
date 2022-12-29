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


const listProject = `https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/meadow-soapy-gecko|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/cooked-dashing-salt|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/swamp-artistic-nebula|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/rural-impossible-honeysuckle|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/concrete-spice-chickadee|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/scintillating-knowledgeable-family|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/congruous-ink-chartreuse|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/shore-cuboid-oboe|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/toothsome-tall-handspring|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/emphasized-night-thrush|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/feather-ring-buckaroo|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/nervous-shadowed-pencil|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/tricolor-hospitable-epoxy|https://b21c4b6c-253a-4d84-ba2a-c40e1cf12b12@api.glitch.com/git/noble-field-duke`.trim().split('|');

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