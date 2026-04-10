const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { execFile } = require("child_process");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture || "",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function readSession(req) {
  const token = req.cookies?.token;
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.session = session;
  return next();
}

app.get("/hello", (req, res) => {
  res.json({ message: "Hello World" });
});

app.post("/auth/google", async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res
        .status(500)
        .json({ message: "GOOGLE_CLIENT_ID is not configured" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Missing idToken" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const user = {
      id: payload.sub,
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || "",
    };

    const token = createSessionToken(user);
    setAuthCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed" });
  }
});

app.get("/auth/me", (req, res) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ message: "Session not found" });
  }

  return res.json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      picture: session.picture || "",
    },
  });
});

app.post("/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(204).send();
});

app.post("/run", requireAuth, (req, res) => {
  const { code } = req.body;
  const env = {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    NO_COLOR: "1",
    PYTHON_COLORS: "0",
  };

  execFile(
    "python",
    ["-c", code],
    { encoding: "utf8", env },
    (error, stdout, stderr) => {
      res.json({ stdout, stderr, exitCode: error ? error.code : 0 });
    },
  );
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
