/**
 * Middleware module
 */
// const VisitorsMiddleware = require('./visitors')

const middleware = []

const indexMiddleware = (req, res, next) => {
  if(!middleware.length) next()
  middleware.forEach((item) => {
    item(req, res, next)
  })
}

module.exports = indexMiddleware
