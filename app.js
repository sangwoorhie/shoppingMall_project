const express = require("express");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

const User = require("./schemas/user.js");

// 회원가입
router.post("/users", async (req, res) => {
  const { email, nickname, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    res.status(400).json({
      errorMessage: "password와 confirmPassword가 일치하지 않습니다.",
    });
    return;
  }

  const existUser = await User.findOne({
    $or: [{ email: email }, { nickname: nickname }], // 둘중 하나라도 해당하는 값이있을 때
  });
  if (existUser) {
    res.status(400).json({
      errorMessage: "동일한 E-mail 또는 Nickname이 이미 존재합니다.",
    });
    return;
  }

  const user = new User({ email, nickname, password });
  await user.save(); // DB저장
  res.status(201).json({});
});

// 로그인
const jwt = require("jsonwebtoken");

router.post("/auth", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // 인증 실패시, 인증 메세지는 자세히 설명하지 않는것을 원칙으로 한다: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
  if (!user || password !== user.password) {
    res.status(400).send({
      errorMessage: "이메일 또는 패스워드가 틀렸습니다.",
    });
    return;
  }
  const token = jwt.sign({ userId: user.userId }, "customized-secret-key");
  res.status(200).json({ token: token });
});

const authMiddleare = require("./middlewares/auth-middleware.js");

// 자기정보 조회
router.get("/user/me", authMiddleare, async (req, res) => {
  res.json({ user: res.locals.user });
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});
