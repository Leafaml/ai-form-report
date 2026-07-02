/**
 * 邮件服务 — 可插拔接口
 *
 * 当前使用控制台打印（开发模式）。
 * 切换到 Resend/SendGrid 只需实现 MailProvider 接口替换即可。
 */

export interface MailProvider {
  sendVerificationCode(email: string, code: string): Promise<void>;
}

// ── Mock 实现（开发用）──

const mockProvider: MailProvider = {
  async sendVerificationCode(email: string, code: string) {
    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("📧 [DEV] 验证码邮件");
    console.log(`   收件人: ${email}`);
    console.log(`   验证码: ${code}`);
    console.log(`   有效期: 5 分钟`);
    console.log("═══════════════════════════════════════");
    console.log("");
  },
};

// ── 导出当前使用的 provider ──

let currentProvider: MailProvider = mockProvider;

/** 替换邮件服务实现（接 Resend 时调用） */
export function setMailProvider(provider: MailProvider): void {
  currentProvider = provider;
}

export function getMailProvider(): MailProvider {
  return currentProvider;
}
