import bcrypt from "bcrypt";

const password = "admin123"; // 👉 change this to your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then((hash) => {
  console.log("Hashed password:", hash);
}).catch((err) => {
  console.error(err);
});
