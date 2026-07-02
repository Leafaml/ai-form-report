import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { getMailProvider } from "../lib/mail";
import { AppError } from "../middleware/error-handler";

const SALT_ROUNDS = 12;
const CODE_EXPIRY_MINUTES = 5;

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/** 注册——创建未验证用户，发送验证码 */
export async function register(email: string, password: string) {
  if (!email || !password) {
    throw new AppError(400, "邮箱和密码不能为空");
  }
  if (password.length < 6) {
    throw new AppError(400, "密码至少 6 位");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "该邮箱已注册");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.create({
    data: { email, password: hashed, emailVerified: false },
  });

  // 生成并发送验证码
  await sendCode(email);

  return { message: "验证码已发送，请查收邮箱" };
}

/** 登录——未验证也可登录但提示 */
export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new AppError(400, "邮箱和密码不能为空");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "邮箱或密码错误");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, "邮箱或密码错误");
  }

  // TODO: 正式上线前启用邮箱验证
  // if (!user.emailVerified) {
  //   throw new AppError(403, "邮箱未验证，请先完成验证");
  // }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  };
}

/** 验证邮箱 */
export async function verifyEmail(email: string, code: string) {
  if (!email || !code) {
    throw new AppError(400, "邮箱和验证码不能为空");
  }

  const record = await prisma.verificationCode.findFirst({
    where: { email, code, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError(400, "验证码错误");
  }
  if (record.expiresAt < new Date()) {
    throw new AppError(400, "验证码已过期，请重新发送");
  }

  // 标记已使用 + 激活用户
  await prisma.$transaction([
    prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { email }, data: { emailVerified: true } }),
  ]);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(500, "用户不存在");

  const token = signToken({ userId: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
  };
}

/** 获取当前用户 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "用户不存在");
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    deepseekApiKey: user.deepseekApiKey ? `sk-...${user.deepseekApiKey.slice(-4)}` : null,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

/** 获取用户的 DeepSeek API Key（完整） */
export async function getApiKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.deepseekApiKey) throw new AppError(400, "请先在设置中配置 DeepSeek API Key");
  return user.deepseekApiKey;
}

/** 更新个人资料 */
export async function updateProfile(userId: string, data: { nickname?: string; avatar?: string; deepseekApiKey?: string }) {
  const updates: Record<string, string> = {};
  if (data.nickname !== undefined) {
    if (!data.nickname.trim()) throw new AppError(400, "昵称不能为空");
    if (data.nickname.trim().length > 20) throw new AppError(400, "昵称最多 20 个字符");
    updates.nickname = data.nickname.trim();
  }
  if (data.avatar !== undefined) {
    updates.avatar = data.avatar;
  }
  if (data.deepseekApiKey !== undefined) {
    const key = data.deepseekApiKey.trim();
    if (key && !key.startsWith("sk-")) throw new AppError(400, "API Key 格式错误，应以 sk- 开头");
    updates.deepseekApiKey = key;
  }
  if (Object.keys(updates).length === 0) throw new AppError(400, "没有需要更新的内容");

  const user = await prisma.user.update({ where: { id: userId }, data: updates });
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    deepseekApiKey: user.deepseekApiKey ? `sk-...${user.deepseekApiKey.slice(-4)}` : null,
  };
}

/** 修改密码 */
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  if (!oldPassword || !newPassword) throw new AppError(400, "密码不能为空");
  if (newPassword.length < 6) throw new AppError(400, "新密码至少 6 位");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "用户不存在");

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw new AppError(400, "原密码错误");

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return { message: "密码修改成功" };
}

/** 重新发送验证码 */
export async function resendCode(email: string) {
  if (!email) throw new AppError(400, "邮箱不能为空");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(404, "该邮箱未注册");
  if (user.emailVerified) throw new AppError(400, "邮箱已验证，无需重复验证");

  await sendCode(email);

  return { message: "验证码已重新发送，请查收邮箱" };
}

// ── 内部工具 ──

async function sendCode(email: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: { email, code, expiresAt },
  });

  const mail = getMailProvider();
  await mail.sendVerificationCode(email, code);
}
