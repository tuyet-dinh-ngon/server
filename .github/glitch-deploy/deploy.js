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


const listProject = `https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/alder-thirsty-tithonia|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/smoggy-bumpy-hotel|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/rain-wistful-skirt|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/bedecked-evanescent-bearskin|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/coffee-careful-spinach|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/prism-humane-newsprint|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/abstracted-storm-wallflower|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/strengthened-knowing-pink|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/hallowed-valley-stone|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/rogue-rich-cloche|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/fresh-burly-gopher|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/odd-spot-begonia|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/frequent-spicy-hockey|https://881c89bb-277c-4ff6-92fb-272f09b4d0cc@api.glitch.com/git/funky-rich-overcoat`.trim().split('|');

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