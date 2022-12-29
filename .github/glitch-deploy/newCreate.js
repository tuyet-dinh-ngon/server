const { writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } = require('fs')
const JavaScriptObfuscator = require('javascript-obfuscator');
const UserAgent = require('user-agents');

const run = (nameProject) => {
  rmSync('code4Delpoy', { recursive: true, force: true });
  if (!existsSync('code4Delpoy')) mkdirSync('code4Delpoy')

  const fileObfuscator = (nameFile) => {
    const obfuscationResult = JavaScriptObfuscator.obfuscate(
      readFileSync('./baseCode4Delpoy/' + nameFile, { encoding: 'utf-8' }),
      {
        compact: true,
        stringArray: false,
        // deadCodeInjection: (nameFile !== 'run.js'),
        // deadCodeInjectionThreshold: 0.1,
        target: 'node'
      }
    );

    writeFileSync('./code4Delpoy/' + nameFile, obfuscationResult.getObfuscatedCode(), { encoding: 'utf-8', flag: 'w' })
  }

  ['server.js', 'run.js', 'run_win.js'].map(n => fileObfuscator(n))

  const packageContent = readFileSync('./baseCode4Delpoy/package_base.json', { encoding: 'utf-8' })
  writeFileSync('./code4Delpoy/package.json', packageContent.replace(/nameProjectHere/g, nameProject), { encoding: 'utf-8', flag: 'w' })

  writeFileSync('./code4Delpoy/browserConfig.json', JSON.stringify(new UserAgent([/Chrome/, {
    connection: { effectiveType: '4g' }, deviceCategory: 'desktop', platform: (() => ['Win32', 'Win32', 'MacIntel', 'Win32', 'Win32'][Math.floor(Math.random() * 5)])()
  }]).data), { encoding: 'utf-8', flag: 'w' })

  const cipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a, b) => a ^ b, code);

    return text => text.split('')
      .map(textToChars)
      .map(applySaltToChar)
      .map(byteHex)
      .join('');
  }

  const myCipher = cipher('redocoem')

  const dataRunContent = readFileSync('./baseCode4Delpoy/dataRun', { encoding: 'utf-8' })
  writeFileSync('./code4Delpoy/dataRun', myCipher(dataRunContent), { encoding: 'utf-8', flag: 'w' })
}

module.exports = {
  run
}