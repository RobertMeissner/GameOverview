// Artillery processor for feature flag load testing

module.exports = {
  // Generate random flag names for testing
  generateRandomFlag: function(context, events, done) {
    const flags = [
      'authentication',
      'new_dashboard',
      'checkout_flow',
      'mobile_app',
      'beta_features',
      'dark_mode',
      'advanced_search',
      'social_features'
    ]

    context.vars.randomFlag = flags[Math.floor(Math.random() * flags.length)]
    return done()
  },

  // Generate random user ID
  generateRandomUser: function(context, events, done) {
    context.vars.randomUser = `load_user_${Math.floor(Math.random() * 1000)}`
    return done()
  },

  // Log flag evaluation results
  logFlagResult: function(requestParams, response, context, events, done) {
    if (response.body) {
      try {
        const result = JSON.parse(response.body)
        console.log(`Flag ${context.vars.randomFlag} for user ${context.vars.randomUser}: ${result.enabled} (${result.reason})`)
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    return done()
  },

  // Custom metrics
  trackFlagMetrics: function(requestParams, response, context, events, done) {
    if (response.statusCode === 200 && response.body) {
      try {
        const result = JSON.parse(response.body)

        // Track flag evaluation reasons
        events.emit('counter', `flag.reason.${result.reason}`, 1)

        // Track enabled vs disabled
        events.emit('counter', `flag.enabled.${result.enabled}`, 1)

        // Track variants
        if (result.variant) {
          events.emit('counter', `flag.variant.${result.variant}`, 1)
        }

        // Track response time by flag
        events.emit('histogram', `flag.response_time.${context.vars.randomFlag}`, response.timings.response)

      } catch (e) {
        events.emit('counter', 'flag.parse_error', 1)
      }
    }

    return done()
  }
}
