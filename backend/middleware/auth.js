const admin = require("firebase-admin");

module.exports = async function (req, res, next) {
  console.log("Auth middleware hit:", req.method, req.originalUrl);
  const token = req.header("Authorization")?.split(" ")[1];
  console.log("Auth token:", token ? token.substring(0, 20) + "..." : "None");
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (err) {
    console.error("Firebase token verification error:", err);
    res.status(401).json({ msg: "Invalid token" });
  }
};
