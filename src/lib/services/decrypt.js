const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const ENCODING = 'utf8'

const libDecrypt = require('./../../lib/helpers/decrypt')

class Decrypt {
  constructor (directory = '.') {
    this.directory = directory

    this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
    this.envVaultFilepath = path.resolve(this.directory, '.env.vault')

    this.processedEnvs = []
    this.changedFilenames = new Set()
    this.unchangedFilenames = new Set()
  }

  run () {
    if (!fs.existsSync(this.envVaultFilepath)) {
      const code = 'MISSING_ENV_VAULT_FILE'
      const message = `.env.vault does not exist at [${this.envVaultFilepath}]`
      const help = `? generate one with [dotenvx encrypt ${this.directory}]`

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    if (!fs.existsSync(this.envKeysFilepath)) {
      const code = 'MISSING_ENV_KEYS_FILE'
      const message = `.env.keys does not exist at [${this.envKeysFilepath}]`
      const help = '? a .env.keys file must be present in order to decrypt your .env.vault contents to .env file(s)'

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const dotenvKeys = dotenv.configDotenv({ path: this.envKeysFilepath }).parsed
    const dotenvVault = dotenv.configDotenv({ path: this.envVaultFilepath }).parsed

    Object.entries(dotenvKeys).forEach(([dotenvKey, value]) => {
      const environment = dotenvKey.replace('DOTENV_KEY_', '').toLowerCase()
      const vaultKey = `DOTENV_VAULT_${environment.toUpperCase()}`
      const ciphertext = dotenvVault[vaultKey] // attempt to find ciphertext

      const row = {}
      row.environment = environment
      row.dotenvKey = value.trim()
      row.ciphertext = ciphertext

      if (ciphertext && ciphertext.length >= 1) {
        // Decrypt
        const decrypted = libDecrypt(ciphertext, value.trim())
        row.decrypted = decrypted

        // envFilename
        // replace _ with . to support filenames like .env.development.local
        let envFilename = `.env.${environment.replace('_', '.')}`
        if (environment === 'development') {
          envFilename = '.env'
        }
        row.filename = envFilename
        row.filepath = path.resolve(this.directory, envFilename)

        // check if exists and is changing
        if (fs.existsSync(row.filepath) && (fs.readFileSync(row.filepath, { encoding: ENCODING }).toString() === decrypted)) {
          this.unchangedFilenames.add(envFilename)
        } else {
          row.shouldWrite = true
          this.changedFilenames.add(envFilename)
        }
      } else {
        const message = `${vaultKey} missing in .env.vault: ${this.envVaultFilepath}`
        const warning = new Error(message)
        row.warning = warning
      }

      this.processedEnvs.push(row)
    })

    return {
      processedEnvs: this.processedEnvs,
      changedFilenames: [...this.changedFilenames],
      unchangedFilenames: [...this.unchangedFilenames]
    }
  }
}

module.exports = Decrypt
