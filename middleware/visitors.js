const db = require('../models/index');

/**
 *  Stamping Visitors
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns next() or null
 */
 
const VisitorsMiddleware = async (req, res, next) => {
  const visitorId = req.query.sessionId || null;
  if(!visitorId) return next()
  
  const visitors = await db.models.Visitors.findOne(
    {cookieId: visitorId}
  ).exec();
  if(!visitors) {
    db.models.Visitors.create({
      cookieId: visitorId,
      lastIp:req.connection.remoteAddress,
      lastReferer: req.headers.referer
    });
  } else {
    db.models.Visitors.updateOne(
      {cookieId: visitorId},
      {
        lastIp:req.connection.remoteAddress,
        lastReferer: req.headers.referer
    });
  }
  return next()
}

module.exports = VisitorsMiddleware
