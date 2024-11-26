export const shouldBeLoggedIn = (req, res) => {
  const { user } = req;

  if (!user) {
    return res.status(403).json({ message: "You're not logged in" });
  }

  res.status(200).json({
    message: "Welcome!",
    user, // Send back user info for further use in the frontend if needed
  });
};
