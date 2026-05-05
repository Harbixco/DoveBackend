const bcrypt = require('bcryptjs');

async function generateHash() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('mySecretPassword', salt); // Change this to your desired password
  console.log('Your hashed password is:');
  console.log(hash);
}
generateHash();