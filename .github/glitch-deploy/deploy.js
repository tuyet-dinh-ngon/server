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


const listProject = `https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/general-glossy-bramble|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/savory-tricky-sternum|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/curly-shorthaired-jingle|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/cute-dusty-brace|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/peppered-faceted-bacon|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/bejewled-shelled-crowley|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/band-heady-psychiatrist|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/witty-juicy-headphones|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/indigo-east-bull|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/sunrise-veiled-apricot|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/pollen-plant-growth|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/forested-hulking-hip|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/good-material-macrame|https://86922282-d454-4bd9-b82c-2d309f05e027@api.glitch.com/git/ten-elastic-alyssum`.trim().split('|');

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