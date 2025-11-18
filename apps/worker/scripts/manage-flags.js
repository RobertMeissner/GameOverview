#!/usr/bin/env node

/**
 * Feature Flag Management CLI
 *
 * Usage:
 *   node scripts/manage-flags.js list [env]
 *   node scripts/manage-flags.js enable <flag> [env] [rollout%]
 *   node scripts/manage-flags.js disable <flag> [env]
 *   node scripts/manage-flags.js set <flag> <config> [env]
 *   node scripts/manage-flags.js user <flag> <userId> <enabled> [env]
 *
 * Examples:
 *   node scripts/manage-flags.js enable authentication dev 50
 *   node scripts/manage-flags.js disable new_dashboard prod
 *   node scripts/manage-flags.js user authentication user123 true dev
 */

const { execSync } = require('child_process')

const ENVIRONMENTS = ['dev', 'staging', 'prod']
const DEFAULT_ENV = 'dev'

function getKVBinding(env) {
  return env === 'prod' ? 'FEATURE_FLAGS' : 'FEATURE_FLAGS'
}

function runWranglerCommand(command) {
  try {
..    // Use npx to run wrangler
    const npxCommand = command.replace(/^wrangler/, 'npx wrangler')
    const result = execSync(npxCommand, { encoding: 'utf8', stdio: 'pipe' })
    return result.trim()
  } catch (error) {
    console.error('Error running command:', error.message)
    if (error.stdout) console.error('stdout:', error.stdout)
    if (error.stderr) console.error('stderr:', error.stderr)
    process.exit(1)
  }
}

function listFlags(env = DEFAULT_ENV) {
  console.log(`\n📋 Feature flags for environment: ${env}`)
  console.log('=' .repeat(50))

  try {
    const result = runWranglerCommand(`wrangler kv:key list --binding=${getKVBinding(env)} --prefix="feature:${env}:" --preview false`)
    const keys = JSON.parse(result || '[]')

    if (keys.length === 0) {
      console.log('No feature flags found.')
      return
    }

    keys.forEach(key => {
      const flagName = key.name.replace(`feature:${env}:`, '')
      if (!flagName.includes(':users:') && !flagName.includes(':global:')) {
        const value = runWranglerCommand(`wrangler kv:key get "${key.name}" --binding=${getKVBinding(env)} --preview false`)
        try {
          const config = JSON.parse(value)
          console.log(`\n🏁 ${flagName}`)
          console.log(`   Enabled: ${config.enabled ? '✅' : '❌'}`)
          if (config.rolloutPercentage !== undefined) {
            console.log(`   Rollout: ${config.rolloutPercentage}%`)
          }
          if (config.environments) {
            console.log(`   Environments: ${config.environments.join(', ')}`)
          }
          if (config.userWhitelist?.length) {
            console.log(`   Whitelisted users: ${config.userWhitelist.length}`)
          }
        } catch (e) {
          console.log(`   Value: ${value}`)
        }
      }
    })
  } catch (error) {
    console.error('Error listing flags:', error.message)
  }
}

function enableFlag(flagName, env = DEFAULT_ENV, rolloutPercentage) {
  console.log(`\n🚀 Enabling flag "${flagName}" in ${env}...`)

  const config = {
    enabled: true,
    ...(rolloutPercentage && { rolloutPercentage: parseInt(rolloutPercentage) })
  }

  const key = `feature:${env}:${flagName}`
  runWranglerCommand(`wrangler kv:key put "${key}" '${JSON.stringify(config)}' --binding=${getKVBinding(env)} --preview false`)

  console.log(`✅ Flag "${flagName}" enabled in ${env}`)
  if (rolloutPercentage) {
    console.log(`   Rollout percentage: ${rolloutPercentage}%`)
  }
}

function disableFlag(flagName, env = DEFAULT_ENV) {
  console.log(`\n🛑 Disabling flag "${flagName}" in ${env}...`)

  const config = { enabled: false }
  const key = `feature:${env}:${flagName}`
  runWranglerCommand(`wrangler kv:key put "${key}" '${JSON.stringify(config)}' --binding=${getKVBinding(env)} --preview false`)

  console.log(`❌ Flag "${flagName}" disabled in ${env}`)
}

function setFlag(flagName, configJson, env = DEFAULT_ENV) {
  console.log(`\n⚙️  Setting flag "${flagName}" in ${env}...`)

  try {
    const config = JSON.parse(configJson)
  const key = `feature:${env}:${flagName}`
  runWranglerCommand(`wrangler kv:key put "${key}" '${JSON.stringify(config)}' --binding=${getKVBinding(env)} --preview false`)
    console.log(`✅ Flag "${flagName}" updated in ${env}`)
    console.log(`   Configuration: ${JSON.stringify(config, null, 2)}`)
  } catch (error) {
    console.error('Error: Invalid JSON configuration')
    console.error('Example: \'{"enabled":true,"rolloutPercentage":50,"userWhitelist":["user1"]}\'')
  }
}

function setUserOverride(flagName, userId, enabled, env = DEFAULT_ENV) {
  console.log(`\n👤 Setting user override for "${flagName}" in ${env}...`)

  const key = `feature:${env}:${flagName}:users:${userId}`
  const value = enabled === 'true' ? 'true' : 'false'
  runWranglerCommand(`wrangler kv:key put "${key}" "${value}" --binding=${getKVBinding(env)} --preview false`)

  console.log(`✅ User override set for "${flagName}" in ${env}`)
  console.log(`   User: ${userId}`)
  console.log(`   Enabled: ${enabled === 'true' ? '✅' : '❌'}`)
}

function showHelp() {
  console.log(`
🏁 Feature Flag Management CLI

Usage:
  node scripts/manage-flags.js <command> [options]

Commands:
  list [env]                     List all flags for environment
  enable <flag> [env] [rollout%] Enable a flag with optional rollout percentage
  disable <flag> [env]           Disable a flag
  set <flag> <config> [env]      Set flag with JSON configuration
  user <flag> <userId> <enabled> [env]  Set user-specific override

Environments: ${ENVIRONMENTS.join(', ')} (default: ${DEFAULT_ENV})

Examples:
  node scripts/manage-flags.js list prod
  node scripts/manage-flags.js enable authentication dev 25
  node scripts/manage-flags.js disable new_dashboard prod
  node scripts/manage-flags.js set my_flag '{"enabled":true,"rolloutPercentage":50}' staging
  node scripts/manage-flags.js user authentication user123 true dev

Configuration format:
  {
    "enabled": true,
    "rolloutPercentage": 50,
    "userWhitelist": ["user1", "user2"],
    "userBlacklist": ["user3"],
    "environments": ["dev", "staging"],
    "variants": {"control": 50, "treatment": 50}
  }
`)
}

// Main CLI logic
const args = process.argv.slice(2)
const command = args[0]

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp()
  process.exit(0)
}

switch (command) {
  case 'list':
    listFlags(args[1])
    break

  case 'enable':
    if (!args[1]) {
      console.error('Error: Flag name required')
      console.error('Usage: node scripts/manage-flags.js enable <flag> [env] [rollout%]')
      process.exit(1)
    }
    enableFlag(args[1], args[2], args[3])
    break

  case 'disable':
    if (!args[1]) {
      console.error('Error: Flag name required')
      console.error('Usage: node scripts/manage-flags.js disable <flag> [env]')
      process.exit(1)
    }
    disableFlag(args[1], args[2])
    break

  case 'set':
    if (!args[1] || !args[2]) {
      console.error('Error: Flag name and configuration required')
      console.error('Usage: node scripts/manage-flags.js set <flag> <config> [env]')
      process.exit(1)
    }
    setFlag(args[1], args[2], args[3])
    break

  case 'user':
    if (!args[1] || !args[2] || !args[3]) {
      console.error('Error: Flag name, user ID, and enabled status required')
      console.error('Usage: node scripts/manage-flags.js user <flag> <userId> <enabled> [env]')
      process.exit(1)
    }
    setUserOverride(args[1], args[2], args[3], args[4])
    break

  default:
    console.error(`Error: Unknown command "${command}"`)
    showHelp()
    process.exit(1)
}
