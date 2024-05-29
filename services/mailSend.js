/* eslint-disable no-console */
require('dotenv').config();
const { APIClient, SendEmailRequest, RegionUS } = require("customerio-node");
const ShortUniqueId = require('short-unique-id');

const APP_KEY = process.env.EMAIL_API_KEY || null;

const logger = require('./logger');

const mailSend = async ({sendEmailTo, sendTemplateId, messageData=undefined, subject=undefined, body=undefined}) => {
  if(!APP_KEY) return null;
  const api = new APIClient(APP_KEY, { region: RegionUS });
  const messageId = new ShortUniqueId({ length: 10 });
  const request = new SendEmailRequest({
    to: sendEmailTo,
    subject,
    body,
    transactional_message_id: sendTemplateId,
    message_data: { password_reset_token : messageData.passwordResetURL },
    identifiers: {
      id: messageId()
    }
  });

  return api.sendEmail(request)
    .then(res => res)
    .catch(err => logger.error(err));
};

module.exports = {
  mailSend
};