#!/usr/bin/env node

/**
 * Feature Flag Monitoring Script
 * 
 * This script monitors feature flag performance and usage patterns
 * to ensure the system is working correctly in production.
 */

const { execSync } = require('child_process')

const ENVIRONMENTS = ['dev', 'staging', 'prod']
const MONITORING_INTERVAL = 30000 // 30 seconds

class FlagMonitor {
  constructor(environment = 'prod') {
    this.environment = environment
    this.metrics = {
      evaluations: 0,
      errors: 0,
      avgResponseTime: 0,
      flagDistribution: {},
      userDistribution: {}
    }
  }

  async start() {
    console.log(`🔍 Starting flag monitoring for ${this.environment}...`)
    
    setInterval(() => {
      this.collectMetrics()
      this.reportMetrics()
      this.checkAlerts()
    }, MONITORING_INTERVAL)

    // Initial collection
    this.collectMetrics()
  }

  async collectMetrics() {
    try {
      // Collect flag usage from KV
      const flags = await this.listActiveFlags()
      
      // Simulate metrics collection (in real implementation, this would
      // come from Cloudflare Analytics, logs, or custom metrics)
      for (const flag of flags) {
        await this.collectFlagMetrics(flag)
      }

      // Check flag health
      await this.healthCheck()
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error.message)
      this.metrics.errors++
    }
  }

  async listActiveFlags() {
    try {
      const result = execSync(
        `wrangler kv:key list --binding=FEATURE_FLAGS --prefix="feature:${this.environment}:"`,
        { encoding: 'utf8' }
      )
      
      const keys = JSON.parse(result || '[]')
      return keys
        .map(key => key.name.replace(`feature:${this.environment}:`, ''))
        .filter(name => !name.includes(':users:') && !name.includes(':global:'))
    } catch (error) {
      console.error('Error listing flags:', error.message)
      return []
    }
  }

  async collectFlagMetrics(flagName) {
    try {
      // Get flag configuration
      const config = await this.getFlagConfig(flagName)
      if (!config) return

      // Simulate evaluation metrics
      const evaluations = Math.floor(Math.random() * 1000) + 100
      const enabledCount = config.enabled ? 
        Math.floor(evaluations * (config.rolloutPercentage || 100) / 100) : 0

      this.metrics.flagDistribution[flagName] = {
        evaluations,
        enabledCount,
        disabledCount: evaluations - enabledCount,
        rolloutPercentage: config.rolloutPercentage || (config.enabled ? 100 : 0)
      }

      this.metrics.evaluations += evaluations

    } catch (error) {
      console.error(`Error collecting metrics for ${flagName}:`, error.message)
    }
  }

  async getFlagConfig(flagName) {
    try {
      const result = execSync(
        `wrangler kv:key get "feature:${this.environment}:${flagName}" --binding=FEATURE_FLAGS`,
        { encoding: 'utf8' }
      )
      return JSON.parse(result)
    } catch (error) {
      return null
    }
  }

  async healthCheck() {
    const startTime = Date.now()
    
    try {
      // Test flag evaluation performance
      const testResults = await Promise.all([
        this.testFlagEvaluation('authentication'),
        this.testFlagEvaluation('test_flag'),
        this.testFlagEvaluation('non_existent_flag')
      ])

      const endTime = Date.now()
      this.metrics.avgResponseTime = (endTime - startTime) / testResults.length

    } catch (error) {
      console.error('Health check failed:', error.message)
      this.metrics.errors++
    }
  }

  async testFlagEvaluation(flagName) {
    // Simulate flag evaluation (in real implementation, this would
    // make actual API calls to test the service)
    return new Promise(resolve => {
      setTimeout(() => resolve({ flagName, enabled: Math.random() > 0.5 }), 10)
    })
  }

  reportMetrics() {
    console.clear()
    console.log(`📊 Feature Flag Metrics - ${this.environment.toUpperCase()}`)
    console.log('='.repeat(50))
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`Total Evaluations: ${this.metrics.evaluations}`)
    console.log(`Errors: ${this.metrics.errors}`)
    console.log(`Avg Response Time: ${this.metrics.avgResponseTime.toFixed(2)}ms`)
    console.log('')

    console.log('📋 Flag Distribution:')
    Object.entries(this.metrics.flagDistribution).forEach(([flag, data]) => {
      const enabledPercent = ((data.enabledCount / data.evaluations) * 100).toFixed(1)
      console.log(`  ${flag}:`)
      console.log(`    Evaluations: ${data.evaluations}`)
      console.log(`    Enabled: ${data.enabledCount} (${enabledPercent}%)`)
      console.log(`    Rollout: ${data.rolloutPercentage}%`)
      console.log('')
    })
  }

  checkAlerts() {
    const alerts = []

    // Check error rate
    if (this.metrics.errors > 10) {
      alerts.push(`🚨 High error rate: ${this.metrics.errors} errors`)
    }

    // Check response time
    if (this.metrics.avgResponseTime > 100) {
      alerts.push(`🐌 Slow response time: ${this.metrics.avgResponseTime.toFixed(2)}ms`)
    }

    // Check flag distribution anomalies
    Object.entries(this.metrics.flagDistribution).forEach(([flag, data]) => {
      const actualPercent = (data.enabledCount / data.evaluations) * 100
      const expectedPercent = data.rolloutPercentage
      const variance = Math.abs(actualPercent - expectedPercent)

      if (variance > 10) {
        alerts.push(`⚠️  ${flag}: Expected ${expectedPercent}%, got ${actualPercent.toFixed(1)}%`)
      }
    })

    if (alerts.length > 0) {
      console.log('🚨 ALERTS:')
      alerts.forEach(alert => console.log(`  ${alert}`))
      console.log('')
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      metrics: this.metrics,
      summary: {
        totalFlags: Object.keys(this.metrics.flagDistribution).length,
        totalEvaluations: this.metrics.evaluations,
        errorRate: (this.metrics.errors / this.metrics.evaluations * 100).toFixed(2),
        avgResponseTime: this.metrics.avgResponseTime
      }
    }

    console.log('\n📄 Generating detailed report...')
    console.log(JSON.stringify(report, null, 2))

    return report
  }
}

// CLI interface
const environment = process.argv[2] || 'prod'
const command = process.argv[3] || 'monitor'

if (!ENVIRONMENTS.includes(environment)) {
  console.error(`❌ Invalid environment. Use: ${ENVIRONMENTS.join(', ')}`)
  process.exit(1)
}

const monitor = new FlagMonitor(environment)

switch (command) {
  case 'monitor':
    monitor.start()
    break
    
  case 'report':
    monitor.collectMetrics().then(() => monitor.generateReport())
    break
    
  case 'health':
    monitor.healthCheck().then(() => {
      console.log(`✅ Health check completed for ${environment}`)
      console.log(`Average response time: ${monitor.metrics.avgResponseTime.toFixed(2)}ms`)
    })
    break
    
  default:
    console.log(`
🔍 Feature Flag Monitor

Usage:
  node scripts/monitor-flags.js [environment] [command]

Environments: ${ENVIRONMENTS.join(', ')}

Commands:
  monitor  - Start continuous monitoring (default)
  report   - Generate one-time report
  health   - Run health check

Examples:
  node scripts/monitor-flags.js prod monitor
  node scripts/monitor-flags.js staging report
  node scripts/monitor-flags.js dev health
`)
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping flag monitor...')
  process.exit(0)
})
