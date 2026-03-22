const bcrypt = require("bcryptjs");

const testHashing = async () => {
    const password = "password123";
    console.log("Original Password:", password);

    // Hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed Password:", hashedPassword);

    // Compare
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log("Password Match:", isMatch);

    const isWrongMatch = await bcrypt.compare("wrongpassword", hashedPassword);
    console.log("Wrong Password Match:", isWrongMatch);
};

testHashing();
