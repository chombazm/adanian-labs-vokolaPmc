const sgMail = require("@sendgrid/mail");
const config = require("../config/config");

sgMail.setApiKey(config.sendgrid.apiKey);

const sendMail = (message) => {
  const msg = { ...message, from: config.sendgrid.mailFrom };
  sgMail
    .send(msg)
    .then(() => {
      return 1;
    })
    .catch((error) => {
      console.log("cant send email");
      console.log(error, "view email erro");
      return 0;
    });
};
const registrationEmail = (req, token) => {
  const message = {
    to: req.body.email,
    subject: `vokola! ${req.body.username} is registered. Activate your account`,
    text: `This email has been registered with vokolapmc. Please activate your email by clicking on this link: ${config.frontend.url}/activate/?token=${token}`,
    html: `This email has been registered with vokolapmc. Please verify your email by clicking on the link: <a href="${config.frontend.url}/activate/?token=${token}&email=${req.body.email}">Verify Email</a>`,
  };
  // console.log(message, "message");
  // to, message, subject;
  if (sendMail(message)) {
    return 1;
  } else {
    console.log("failed to send email");
  }

  return 0;
};

const forgotPasswordEmail = (to, token) => {
  const resetPasswordUrl = `${config.frontend.url}/account/reset-password?token=${token}&email=${to}`;

  const message = {
    to,
    subject: `Account Recovery`,
    text: `Dear user,
    To reset your password, click on this link: ${resetPasswordUrl}
    If you did not request any password resets, then ignore this email.`,
    html: `Dear user,
    To reset your password, click <a href="${resetPasswordUrl}">Here</a> 
    If you did not request any password resets, then ignore this email.`,
  };
  // to, message, subject;
  if (sendMail(message)) return 1;
  return 0;
};
const sendEmailAfterBookPurchase = (to, book) => {
  console.log(book, "email    to send");
  const libraryUrl = `<a href="${config.frontend.url}/library">${config.frontend.url}/library</a>`;
  // const bookUrl = `${config.frontend.url}/library/${book.id}`;
  const message = {
    to,
    subject: `Book Purchased`,
    text: `Dear ${book.user_firstname},
    You have purchased ${book.book_title} Book code: ${book.book_accessCode}. 
    Visit your account ${config.frontend.url}/ to view your purchased books.
    Thank you for your purchase`,
    html: `Dear ${book.user_firstname},
    You have purchased ${book.book_title}. Book code: ${book.book_accessCode}.
    Visit your library ${libraryUrl}/ to view your purchased books.
    Thank you for your purchase`,
  };
  // to, message, subject;
  if (sendMail(message)) return 1;
  return 0;
};
module.exports = {
  sendMail,
  registrationEmail,
  forgotPasswordEmail,
  sendEmailAfterBookPurchase,
};
