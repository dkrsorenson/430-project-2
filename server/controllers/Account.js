const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (request, response) => {
  const req = request;
  const res = response;

  // force cast to strings to cover up security flaws
  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return res.status(400).json({ error: 'Wrong username or password' });
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.json({ redirect: '/recipeBook' });
  });
};

const signup = (request, response) => {
  const req = request;
  const res = response;

  // cast to strings to cover up security flaws
  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
    };

    const newAccount = new Account.AccountModel(accountData);

    const savePromise = newAccount.save();

    savePromise.then(() => {
      req.session.account = Account.AccountModel.toAPI(newAccount);
      return res.json({ redirect: '/recipeBook' });
    });

    savePromise.catch((err) => {
      console.log(err);

      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username already in use' });
      }

      return res.status(400).json({ error: 'An error occurred' });
    });
  });
};

const changePassword = (request, response) => {
  const req = request;
  const res = response;

  const currentPass = `${req.body.currentPass}`;
  const newPass1 = `${req.body.newPass1}`;
  const newPass2 = `${req.body.newPass2}`;
 
  if (!currentPass || !newPass1 || !newPass2) {
    return res.status(400).json({ error: 'All fields are required' });
  }
 
  return Account.AccountModel.authenticate(req.session.account.username, currentPass, (err, account) => {
    if (err || !account) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if(newPass1 !== newPass2){
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    return Account.AccountModel.generateHash(newPass1, (salt, hash) => {
      const accountData = {
        salt,
        password: hash,
      };
  
      return Account.AccountModel.updatePasswordByID(req.session.account._id, accountData, (err2, doc) => {
          if (err2 || !doc) {
            return res.status(400).json({ error: 'An error occured' });
          }

          return res.status(204).json();
      });
    });
  });
}; 

const accountPage = (req, res) => {
  res.render('account', { csrfToken: req.csrfToken() });
};

const getUser = (request, response) => {
  const req = request;
  const res = response;

  return Account.AccountModel.findByUsername(req.session.account.username, (err, account) => {
    if (err) {
      return res.status(400).json({ error: 'An error occured' });
    }

    return res.json({ user: account });
  });
};

const getToken = (request, response) => {
  const req = request;
  const res = response;

  const csrfToken = {
    csrfToken: req.csrfToken(),
  };

  res.json(csrfToken);
};

module.exports.loginPage = loginPage;
module.exports.accountPage = accountPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.changePassword = changePassword;
module.exports.getUser = getUser;
module.exports.getToken = getToken;
